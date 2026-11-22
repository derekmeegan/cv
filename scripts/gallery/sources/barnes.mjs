// Barnes Foundation — https://collection.barnesfoundation.org/
//
// The collection site is a React app in front of an Elasticsearch index, which
// it reads through its own proxy, `/api/search?body=<Elasticsearch query JSON>`.
// The proxy takes no key, cookie or special header, so one GET by document id
// returns the whole record. Object ids are the number in the page URL
// (/objects/<id>/<slug>/); the accession number ("BF811") is the `invno` field.
//
// Images live on the site's CloudFront bucket and are named from two per-object
// "secrets" in the record:
//   <id>_<imageSecret>_n.jpg           320 px long edge
//   <id>_<imageSecret>_m.jpg           640 px
//   <id>_<imageSecret>_b.jpg          1024 px  (what the object page shows)
//   <id>_<imageOriginalSecret>_o.jpg  the photographer's full-size file — the
//                                     only variant over 1024 px. These run to
//                                     roughly 5,000–13,500 px on the long edge
//                                     and 20–100 MB, so resize after download.
//   tiles/<id>/info.json              IIIF info for the zoom tiles (256 px
//                                     static tiles, no full-frame rendition);
//                                     used here only for the original's size.
//   ensembles/<ensembleIndex>.jpg     photo of the whole wall the work hangs
//                                     on, 1024 px wide
//
// The Barnes does not publish a photo of a single work in its frame, so
// `framedImageUrl` is always null. The frame is only visible in the wall
// ("ensemble") photograph, returned as the extra `ensembleImageUrl`.
import { fetchJson, fetchWithRetry, htmlToText, parseCm } from "../lib.mjs";

export const source = "barnes";
export const museum = "Barnes Foundation";
export const city = "Philadelphia";

const SITE = "https://collection.barnesfoundation.org";
const IMAGES = "https://d2r83x5xt28klo.cloudfront.net";

const FIELDS = [
  "id",
  "title",
  "people",
  "culture",
  "artistPrefix",
  "artistSuffix",
  "nationality",
  "birthDate",
  "deathDate",
  "displayDate",
  "medium",
  "dimensions",
  "creditLine",
  "invno",
  "shortDescription",
  "longDescription",
  "objRightsTypeId",
  "ensembleIndex",
  "locations",
  "onview",
  "imageSecret",
  "imageOriginalSecret",
];

// `objRightsTypeId` → the label the site prints under the image. Copied from
// the site's own lookup table; ids it does not list (0, 5, or none) show no
// usable statement.
const RIGHTS = {
  1: "In Copyright",
  2: "Copyright Undetermined",
  3: "In Copyright",
  4: "Public Domain",
  6: "Copyright Undetermined",
  7: "Public Domain",
  8: "Public Domain",
  10: "Public Domain",
  11: "Public Domain, Temporarily Under Exclusive License",
};

function publicDomainFrom(rights) {
  if (rights === "Public Domain") return true;
  // The exclusive-licence case is a public-domain work whose image the museum
  // does not release, so it is not free to reuse.
  if (rights === "In Copyright" || rights === RIGHTS[11]) return false;
  return null;
}

// Dr. Barnes hung the collection in fixed wall "ensembles". The record only
// carries an index; the site maps it to a room and wall like this: 1–92 are
// the four walls (N, E, S, W) of rooms 1–23, the rest are one-off spaces.
const WALLS = ["North Wall", "East Wall", "South Wall", "West Wall"];
const OTHER_SPACES = [
  [93, 93, "Le Bonheur de vivre", null],
  [94, 94, "Second Floor Balcony East (Room 24)", "East Wall"],
  [95, 95, "Second Floor Balcony South (Room 24)", "South Wall"],
  [96, 96, "Second Floor Balcony West (Room 24)", "West Wall"],
  [97, 100, "Mezzanine", null],
  [101, 104, "Gallery Foyer", null],
  [105, 108, "Lower Lobby", null],
];

function ensembleFor(index) {
  if (!Number.isInteger(index) || index < 1) return null;
  if (index <= 92) {
    const room = Math.ceil(index / 4);
    return {
      room: room === 1 ? "Main Room" : `Room ${room}`,
      wall: WALLS[(index - 1) % 4],
    };
  }
  const space = OTHER_SPACES.find(([from, to]) => index >= from && index <= to);
  return space ? { room: space[2], wall: space[3] } : null;
}

export function match(url) {
  return /(^|\.)barnesfoundation\.org$/.test(new URL(url).hostname);
}

// /objects/6994/Models-(Poseuses)/, the same with %28…%29, a bare
// /objects/6994, and the /ensemble and /details panel URLs all carry the id.
function objectIdFromUrl(url) {
  const id = new URL(url).pathname.match(/\/objects\/(\d+)(?:\/|$)/)?.[1];
  if (!id) throw new Error(`No Barnes object id in ${url}`);
  return id;
}

async function recordFor(objectId) {
  const body = {
    size: 1,
    _source: FIELDS,
    query: { ids: { values: [objectId] } },
  };
  const data = await fetchJson(
    `${SITE}/api/search?body=${encodeURIComponent(JSON.stringify(body))}`,
    { headers: { accept: "application/json" } },
  );
  const record = data.hits?.hits?.[0]?._source;
  if (!record) throw new Error(`Barnes object ${objectId} not found`);
  return record;
}

// The site redirects /objects/<id> to the page with its title slug; follow
// that rather than rebuild the slug here.
async function canonicalUrlFor(objectId) {
  const fallback = `${SITE}/objects/${objectId}/`;
  try {
    const res = await fetchWithRetry(
      `${SITE}/objects/${objectId}`,
      { method: "HEAD" },
      2,
    );
    return res.url.startsWith(fallback) ? res.url : fallback;
  } catch {
    return fallback;
  }
}

async function originalPixelSize(objectId) {
  try {
    const info = await fetchJson(
      `${IMAGES}/tiles/${objectId}/info.json`,
      {},
      2,
    );
    return { imageWidth: info.width ?? null, imageHeight: info.height ?? null };
  } catch {
    return { imageWidth: null, imageHeight: null };
  }
}

// Not every ensemble index has a wall photograph, so check before offering it.
async function ensembleImageFor(index) {
  if (!index) return null;
  const url = `${IMAGES}/ensembles/${index}.jpg`;
  try {
    await fetchWithRetry(url, { method: "HEAD" }, 2);
    return url;
  } catch {
    return null;
  }
}

function artistName(record) {
  let name = record.people || record.culture || "Unknown";
  if (record.artistPrefix) name = `${record.artistPrefix} ${name}`;
  if (record.artistSuffix) {
    name += record.artistSuffix.startsWith(",")
      ? record.artistSuffix
      : ` ${record.artistSuffix}`;
  }
  return name;
}

function artistBio(record) {
  const years = [record.birthDate, record.deathDate].filter(Boolean).join("–");
  return [record.nationality, years].filter(Boolean).join(", ") || null;
}

// "Overall: 78 3/4 x 98 3/8 in. (200 x 249.9 cm)". Height comes first; for
// three-dimensional objects there is a third number (depth) to ignore.
function sizeCm(dimensions) {
  const metric = dimensions?.match(/\(([^)]*?)\s*cm\)/)?.[1];
  const numbers = metric?.replace(/,/g, ".").match(/\d+(?:\.\d+)?/g);
  if (numbers?.length >= 2) {
    return { heightCm: Number(numbers[0]), widthCm: Number(numbers[1]) };
  }
  return parseCm(dimensions);
}

// Empty fields come back as "" and sometimes as a stray "."
const clean = (value) => (/[\p{L}\p{N}]/u.test(value ?? "") ? value : null);

export async function resolve(url) {
  const objectId = objectIdFromUrl(url);
  const record = await recordFor(objectId);

  if (!record.imageSecret) {
    throw new Error(`Barnes object ${objectId} has no published image`);
  }

  const rights = RIGHTS[record.objRightsTypeId] ?? null;
  const ensembleIndex =
    Number.parseInt(String(record.ensembleIndex ?? "").split(",")[0], 10) ||
    null;
  const ensemble = ensembleFor(ensembleIndex);
  const shortDescription = htmlToText(record.shortDescription);
  const longDescription = htmlToText(record.longDescription);
  const dimensions = clean(record.dimensions);
  const previewImageUrl = `${IMAGES}/${objectId}_${record.imageSecret}_b.jpg`;

  return {
    source,
    museum,
    city,
    objectId,
    sourceUrl: await canonicalUrlFor(objectId),
    title: record.title,
    artist: artistName(record),
    artistBio: artistBio(record),
    date: record.displayDate || "",
    medium: record.medium || "",
    dimensions,
    ...sizeCm(dimensions),
    creditLine: clean(record.creditLine),
    accession: clean(record.invno),
    description: shortDescription ?? longDescription,
    publicDomain: publicDomainFrom(rights),
    imageUrl: record.imageOriginalSecret
      ? `${IMAGES}/${objectId}_${record.imageOriginalSecret}_o.jpg`
      : previewImageUrl,
    framedImageUrl: null,

    // Extras beyond the shared contract.
    ...(await originalPixelSize(objectId)), // imageWidth, imageHeight of imageUrl
    previewImageUrl, // 1024 px on the long edge
    shortDescription, // gallery-label paragraph
    longDescription, // catalogue essay, where one exists
    rights, // the site's label for objRightsTypeId
    rightsTypeId: record.objRightsTypeId ?? null,
    onView: record.onview === "1",
    location: clean(record.locations),
    ensembleIndex,
    room: ensemble?.room ?? null, // "Main Room", "Room 2" … "Room 23"
    wall: ensemble?.wall ?? null, // "North Wall" …
    ensemble: ensemble
      ? [ensemble.room, ensemble.wall].filter(Boolean).join(", ")
      : null,
    ensembleImageUrl: await ensembleImageFor(ensembleIndex),
  };
}
