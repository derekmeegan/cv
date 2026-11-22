// J. Paul Getty Museum (Getty Center and Getty Villa) — Linked Art API + IIIF.
// https://data.getty.edu/museum/collection/docs/
//
// A public page is https://www.getty.edu/art/collection/object/<slug>. The
// page embeds the slug -> UUID mapping, the UUID keys the Linked Art record,
// and the record names the IIIF manifest that lists every published image.
import { fetchJson, fetchText, htmlToText, parseCm } from "../lib.mjs";

export const source = "getty";
export const museum = "J. Paul Getty Museum";
export const city = "Los Angeles";

const SITE = "https://www.getty.edu/art/collection/object";
const DATA = "https://data.getty.edu/museum/collection";
const AAT = "http://vocab.getty.edu/aat/";
const LOCAL = "https://data.getty.edu/local/thesaurus/";
const CRM = "http://www.cidoc-crm.org/cidoc-crm/";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
const OPEN_CONTENT = /creativecommons\.org\/publicdomain\//;
const LONG_EDGE = 3000;

export function match(url) {
  return /(^|\.)getty\.edu$/.test(new URL(url).hostname);
}

// Linked Art values are a node or a list of nodes, and every node says what
// it is through `classified_as` (mostly Getty AAT ids).
const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const hasType = (node, id) =>
  list(node?.classified_as).some((type) => type.id === id);
const content = (nodes, typeId) =>
  list(nodes)
    .find((node) => hasType(node, typeId))
    ?.content?.trim() || null;

// Slug -> UUID. The object page carries it in a JSON script tag, and because
// redirects are followed this also covers the old /objects/<number>/ URLs.
// The SPARQL endpoint answers the same question if the page stops doing so.
async function uuidFromUrl(url) {
  const { hostname, pathname } = new URL(url);
  if (hostname === "data.getty.edu" && pathname.includes("/object/")) {
    const uuid = pathname.match(UUID)?.[0];
    if (uuid) return uuid;
  }

  const slug = pathname.match(/\/art\/collection\/object\/([0-9A-Za-z]+)/)?.[1];
  try {
    const html = await fetchText(url, {}, 2);
    const embedded = html.match(
      /<script[^>]*id=["']local_id_manager["'][^>]*>([^<]+)<\/script>/,
    )?.[1];
    const id = JSON.parse(embedded ?? "{}").indexedId ?? "";
    if (id.startsWith("object/") && UUID.test(id)) return id.match(UUID)[0];
  } catch (error) {
    if (!slug) throw error;
  }

  if (slug) {
    const query =
      `SELECT ?object WHERE { ?object <${CRM}P1_is_identified_by> ?id . ` +
      `?id <${CRM}P190_has_symbolic_content> "urn:getty-local:idm:object:slug/${slug}" } LIMIT 1`;
    const result = await fetchJson(
      `${DATA}/sparql?query=${encodeURIComponent(query)}`,
      { headers: { accept: "application/sparql-results+json" } },
    );
    const uuid = result.results?.bindings?.[0]?.object?.value?.match(UUID)?.[0];
    if (uuid) return uuid;
  }
  throw new Error(`No Getty collection object at ${url}`);
}

// One maker: the statements sit on the production itself. Several: one `part`
// each. A name can carry a prefix such as "Attributed to" or "and".
function makersOf(production) {
  const parts = list(production?.part).length
    ? list(production.part)
    : list(production);
  return parts
    .map((part) => ({
      name: [
        content(part.referred_to_by, `${LOCAL}producer-name-prefix`),
        content(part.referred_to_by, `${LOCAL}producer-name`) ??
          list(part.carried_out_by)[0]?._label,
      ]
        .filter(Boolean)
        .join(" "),
      bio: content(part.referred_to_by, `${LOCAL}nationality-and-dates`),
    }))
    .filter((maker) => maker.name);
}

// Each measured element ("Unframed", "Framed [Outer Dim]", "Object", "Sheet"…)
// has a display statement plus numeric Dimension nodes filed under the same
// …/dimensions/<id>/ prefix.
function dimensionSets(record) {
  return list(record.referred_to_by)
    .filter((node) => hasType(node, `${AAT}300435430`)) // Dimensions Description
    .map((node) => {
      const set = `${node.id.replace(/\/statement$/, "")}/set`;
      const cm = (typeId) => {
        const dimension = list(record.dimension).find(
          (d) =>
            hasType(d, typeId) &&
            d.unit?.id === `${AAT}300379098` && // centimetres
            list(d.member_of).some((member) => member.id === set),
        );
        return dimension ? Math.round(dimension.value * 10) / 10 : null;
      };
      return {
        statement: node.content.trim(),
        heightCm: cm(`${AAT}300055644`),
        widthCm: cm(`${AAT}300055647`),
        depthCm: cm(`${AAT}300072633`),
      };
    });
}

// The rights statement is the Right in `subject_to`; its URI is one of the
// `classified_as` ids. Getty uses CC0 for Open Content, InC / InC-RUU for
// works in copyright, and UND / CNE when it has not decided.
function rightsOf(record) {
  const right = list(record.subject_to).find((node) =>
    hasType(node, `${LOCAL}rights-statement`),
  );
  return (
    list(right?.classified_as)
      .map((type) => type.id)
      .find((id) => /creativecommons\.org|rightsstatements\.org/.test(id)) ??
    null
  );
}

function isPublicDomain(rights) {
  if (!rights) return null;
  if (OPEN_CONTENT.test(rights)) return true;
  if (/rightsstatements\.org\/vocab\/InC/.test(rights)) return false;
  return null;
}

// About LONG_EDGE px on the long side. The image server (iipsrv) answers 400
// to anything it counts as upscaling — and it counts "!3000,3000" as that
// whenever the *short* side is under 3000 — so size one side explicitly and
// take "max" for images that are already small.
function iiifUrl(service, width, height) {
  const size = !(Math.max(width, height) > LONG_EDGE)
    ? "max"
    : width >= height
      ? `${LONG_EDGE},`
      : `,${LONG_EDGE}`;
  return `${service}/full/${size}/0/default.jpg`;
}

// Every published image, in the museum's order (the first is the main view).
// Labels are free text typed by the photo studio: "Front", "Back", "Framed"…
async function imagesOf(record) {
  const manifestUrl = list(record.subject_of)
    .map((node) => node.id ?? "")
    .find((id) => id.includes("/iiif/manifest/3/"));
  if (!manifestUrl) return [];
  const manifest = await fetchJson(manifestUrl);
  return list(manifest.items).flatMap((canvas) => {
    const service = list(canvas.items?.[0]?.items?.[0]?.body?.service)[0]?.id;
    if (!service) return [];
    return [
      {
        label: Object.values(canvas.label ?? {})[0]?.[0] ?? "",
        url: iiifUrl(service, canvas.width, canvas.height),
        width: canvas.width ?? null,
        height: canvas.height ?? null,
        openContent: OPEN_CONTENT.test(canvas.rights ?? ""),
      },
    ];
  });
}

// "Framed", "framed", "In frame", "Front, framed", "Overall in Frame",
// "Framed, post-cons.", "w/ frame", "Frame with painting" are the work in its
// frame. "Front, unframed", "Back, framed" and "Out of frame verso" are not.
function isFramedView(label) {
  return (
    /\bframed\b|\b(in|with|w\/)\s+(\w+\s+)?frame\b|\bframe with\b/i.test(
      label,
    ) && !/\b(back|verso|reverse|detail|close-?up)\b/i.test(label)
  );
}

// Where the object is on view, else the home of the department that keeps
// it: the Villa holds the antiquities, the Center everything else.
function venueOf(record) {
  const onView = record.current_location?._label?.match(
    /^Getty (Center|Villa)\b/,
  )?.[0];
  if (onView) return onView;
  const department = list(record.current_keeper)[0]?._label ?? "";
  if (/^Antiquities\b/.test(department)) return "Getty Villa";
  if (
    /^(Paintings|Drawings|Manuscripts|Photographs|Sculpture & Decorative Arts)\b/.test(
      department,
    )
  ) {
    return "Getty Center";
  }
  return null;
}

export async function resolve(url) {
  const uuid = await uuidFromUrl(url);
  const record = await fetchJson(`${DATA}/object/${uuid}`);
  const texts = record.referred_to_by;

  const accession = content(record.identified_by, `${AAT}300312355`);
  const objectId =
    content(record.identified_by, `${LOCAL}slug-identifier`)
      ?.split("/")
      .pop() ?? uuid;

  const images = await imagesOf(record);
  const main = images[0];
  if (!main) throw new Error(`Getty object ${objectId} has no published image`);
  // publicDomain speaks for both URLs, so the framed view must be as free as
  // the main one (gallery snapshots, for instance, are not Open Content).
  const framed = images.find(
    (image) =>
      isFramedView(image.label) && image.openContent === main.openContent,
  );

  const makers = makersOf(record.produced_by);
  const names = makers.map((maker) => maker.name);
  const culture = content(texts, `${AAT}300055768`);
  const bios = [...new Set(makers.map((maker) => maker.bio).filter(Boolean))];

  const sets = dimensionSets(record);
  const isFrame = (set) => /^frame/i.test(set.statement);
  const work =
    sets.find((set) => /^unframed/i.test(set.statement)) ??
    sets.find((set) => !isFrame(set));
  const frame = sets.find(isFrame);
  const parsed = parseCm(work?.statement);

  const descriptions = list(texts).filter((node) =>
    hasType(node, `${AAT}300080091`),
  );
  const rights = rightsOf(record);

  return {
    source,
    museum,
    city,
    objectId,
    sourceUrl:
      objectId === uuid ? `${DATA}/object/${uuid}` : `${SITE}/${objectId}`,
    title:
      list(record.identified_by).find(
        (node) => node.type === "Name" && hasType(node, `${AAT}300404670`),
      )?.content ?? record._label,
    artist:
      names.length === 2 && names[1].startsWith("and ")
        ? names.join(" ")
        : names.join(", ") || culture || "Unknown",
    artistBio:
      bios.join("; ").replace(/(\d)\s+-\s+(\d)/g, "$1–$2") || culture || null,
    date: list(record.produced_by?.timespan?.identified_by)[0]?.content ?? "",
    medium: content(texts, `${AAT}300435429`) ?? "",
    dimensions: work?.statement.replace(/^Unframed:\s*/i, "") ?? null,
    heightCm: work?.heightCm ?? parsed.heightCm,
    widthCm: work?.widthCm ?? parsed.widthCm,
    creditLine:
      list(texts).find(
        (node) =>
          hasType(node, `${AAT}300435418`) && hasType(node, `${AAT}300404764`),
      )?.content ?? content(texts, `${AAT}300435418`),
    accession,
    description: htmlToText(
      (
        descriptions.find((node) => node.format === "text/html") ??
        descriptions[0]
      )?.content,
    ),
    // Open Content only when the record says CC0 and the image itself is too.
    publicDomain: isPublicDomain(rights) && main.openContent,
    imageUrl: main.url,
    framedImageUrl: framed?.url ?? null,

    // Getty extras.
    venue: venueOf(record),
    location: record.current_location?._label ?? null,
    rights,
    framedDimensions: frame?.statement ?? null,
    framedHeightCm: frame?.heightCm ?? null,
    framedWidthCm: frame?.widthCm ?? null,
    framedDepthCm: frame?.depthCm ?? null,
    alternateImages: images,
  };
}
