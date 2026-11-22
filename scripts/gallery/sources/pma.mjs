// Philadelphia Museum of Art — there is no public API. The object page is a
// Next.js app-router page, and the whole collection record travels in its
// React flight payload (the `self.__next_f.push` script chunks), so the page
// HTML is the only thing to read. Images are on Micrio's IIIF Image API.
import { fetchJson, fetchText, htmlToText, parseCm } from "../lib.mjs";

export const source = "pma";
export const museum = "Philadelphia Museum of Art";
export const city = "Philadelphia";

const PAGE = "https://www.philamuseum.org/objects";
const IIIF = "https://iiif.micr.io";
// `!w,h` fits the image inside the box and never upscales. The server will
// hand out the native file (/full/max/, capped near 42 megapixels), but 3000px
// on the long edge is plenty for the wall and keeps each file to 1–3 MB.
const IMAGE_SIZE = "!3000,3000";

export function match(url) {
  return /(^|\.)philamuseum\.org$/.test(new URL(url).hostname);
}

// /objects/59202 is what the address bar shows; /collection/object/59202
// redirects to it, and the old site's /collections/permanent/59202.html used
// the same ids.
function objectIdFromUrl(url) {
  const id = new URL(url).pathname.match(
    /\/(?:objects|collection\/object|collections\/permanent)\/(\d+)/,
  )?.[1];
  if (!id) throw new Error(`No PMA object id in ${url}`);
  return id;
}

// The flight payload is a list of `id:value` rows. Most are one line of JSON;
// text rows are `id:T<byte length in hex>,<text>` with no terminator.
function flightRows(html) {
  let payload = "";
  const chunk = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  for (const m of html.matchAll(chunk)) payload += JSON.parse(m[1]);

  const bytes = Buffer.from(payload, "utf8");
  const rows = new Map();
  let i = 0;
  while (i < bytes.length) {
    const colon = bytes.indexOf(":", i);
    if (colon === -1) break;
    const id = bytes.toString("latin1", i, colon);
    let start = colon + 1;
    let end = bytes.indexOf("\n", start);
    if (end === -1) end = bytes.length;
    i = end + 1;
    if (bytes[start] === 0x54 /* T */) {
      const comma = bytes.indexOf(",", start);
      const length = parseInt(bytes.toString("latin1", start + 1, comma), 16);
      start = comma + 1;
      end = start + length;
      i = end;
    }
    rows.set(id, bytes.toString("utf8", start, end));
  }
  return rows;
}

// Long strings (provenance, some labels) are hoisted into their own text row
// and referenced as "$<row id>"; a literal leading "$" is written "$$".
function withTextRows(value, rows) {
  if (typeof value === "string") {
    const row = value.match(/^\$([0-9a-f]+)$/)?.[1];
    return rows.get(row) ?? value.replace(/^\$\$/, "$");
  }
  if (Array.isArray(value)) return value.map((v) => withTextRows(v, rows));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, withTextRows(v, rows)]),
    );
  }
  return value;
}

// The record is the `data` prop of the object component: the collection
// database row (ObjectID, ObjectNumber, Titles, Constituents, …, Views).
function recordFrom(html) {
  const rows = flightRows(html);
  for (const text of rows.values()) {
    if (!text.includes('"ObjectNumber"')) continue;
    let tree;
    try {
      tree = JSON.parse(text);
    } catch {
      continue;
    }
    const pending = [tree];
    while (pending.length) {
      const node = pending.pop();
      if (!node || typeof node !== "object") continue;
      if ("ObjectID" in node && "ObjectNumber" in node) {
        return withTextRows(node, rows);
      }
      pending.push(...Object.values(node));
    }
  }
  return null;
}

const oneLine = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
const enDash = (s) => oneLine(s).replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
const byDisplayOrder = (a, b) => (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0);
const iiifUrl = (view) =>
  `${IIIF}/${view.micrio.shortId}/full/${IMAGE_SIZE}/0/default.jpg`;

// Constituents also list sitters and frame carvers; keep the makers, with the
// museum's qualifier ("Attributed to", "and", "After the painting by", …).
function makersOf(record) {
  const makers = (record.Constituents ?? [])
    .filter((c) => /artist|maker/i.test(c.Role ?? "") && !/frame/i.test(c.Role))
    .filter((c) => c.DisplayName && !/unknown/i.test(c.DisplayName))
    .sort(byDisplayOrder);
  const names = makers.map((c) => {
    const qualifier = /^artist\/maker/i.test(c.Prefix ?? "")
      ? ""
      : (c.Prefix ?? "");
    return oneLine(`${qualifier} ${c.DisplayName}`);
  });
  const bios = makers.map((c) => enDash(c.DisplayDate)).filter(Boolean);
  return {
    artist: names.join(", ").replace(/, and /g, " and ") || "Unknown",
    artistBio: bios.join("; ") || null,
  };
}

// Sizes read "36 3/8 × 28 inches (92.4 × 71.1 cm)", one line per part, often
// followed by a "Framed: H × W × D" (or "Frame:") line. `aspect` is the
// photograph's width / height, used to tell which line the picture shows.
function sizesFrom(dimensions, aspect) {
  // parseCm reads "H × W cm"; drop a third (depth) figure so it does not read W × D.
  const flat = (line) =>
    line.replace(
      /([×x]\s*[\d.]+)\s*[×x]\s*[\d.]+(?:\s*-\s*[\d.]+)?(?=\s*cm)/gi,
      "$1",
    );
  const measure = (line) => ({ line, ...parseCm(flat(line)) });
  const measured = (m) => m.heightCm && m.widthCm;
  const ofFrame = (line) => /\bframed?\b/i.test(line.split(/\d/)[0]);

  const lines = String(dimensions ?? "")
    .split(/\r?\n/)
    .map(oneLine)
    .filter(Boolean);
  const unframed = lines.filter((line) => !ofFrame(line));
  const frame = lines.filter(ofFrame).map(measure).find(measured);
  const work = unframed.map(measure).filter(measured);

  // A diptych lists each panel ("Left panel overall …", "Right panel overall …")
  // but is photographed as one object, panels side by side.
  const panels = work.filter((m) => /overall/i.test(m.line));
  if (panels.length > 1) {
    const width = panels.reduce((sum, p) => sum + p.widthCm, 0);
    work.push({
      heightCm: Math.max(...panels.map((p) => p.heightCm)),
      widthCm: Math.round(width * 10) / 10,
    });
  }
  // Take the first line unless its shape is clearly not the photograph's and
  // another one's is.
  const off = (m) => Math.abs(Math.log(m.widthCm / m.heightCm / aspect));
  const closest = [...work].sort((a, b) => off(a) - off(b))[0];
  const size =
    closest && off(work[0]) > 0.1 && off(closest) < 0.1 ? closest : work[0];

  return {
    dimensions: (unframed.length ? unframed : lines).join("; ") || null,
    heightCm: size?.heightCm ?? null,
    widthCm: size?.widthCm ?? null,
    framedHeightCm: frame?.heightCm ?? null,
    framedWidthCm: frame?.widthCm ?? null,
  };
}

export async function resolve(url) {
  const objectId = objectIdFromUrl(url);
  const sourceUrl = `${PAGE}/${objectId}`;
  const record = recordFrom(await fetchText(sourceUrl));
  if (!record) {
    throw new Error(
      `No collection record in ${sourceUrl} (has the page changed?)`,
    );
  }

  // Views.RightsType is the museum's rights category for the object: "Public
  // Domain", or one of "PMA Owns Copyright", "No Known Claimant", "ARS",
  // "AAMD", "License Acquired", "Licensed with Restrictions".
  // Views.DownloadBehavior 140 is the only value for which the museum's own
  // page shows its Download button; otherwise it says a downloadable image is
  // unavailable because of copyright.
  const views = record.Views ?? {};
  const rights = views.RightsType || null;
  const primary = views.PrimaryView;
  if (!primary?.micrio?.shortId || views.DownloadBehavior !== 140) {
    throw new Error(
      `PMA object ${objectId} has no downloadable image (rights: ${rights}${
        record.Copyright ? `, ${oneLine(record.Copyright)}` : ""
      })`,
    );
  }
  const info = await fetchJson(`${IIIF}/${primary.micrio.shortId}/info.json`);

  // Alternate views are nearly always the back of the canvas
  // ("…v2-pma2018.jpg", "…back-rec.jpg"). The rare photograph of the work in
  // its frame is named "…frmd.jpg".
  const alternates = Object.values(views.SecondaryViews ?? {}).filter(
    (view) => view?.micrio?.shortId,
  );
  const framed = alternates.find(
    (view) =>
      /fra?me?d|frame/i.test(view.MainFile ?? "") &&
      !/back|verso/i.test(view.MainFile ?? ""),
  );

  const title = [...(record.Titles ?? [])].sort(byDisplayOrder)[0]?.Title;
  const years = [
    ...new Set([record.DateBegin, record.DateEnd].filter(Boolean)),
  ];
  const { framedHeightCm, framedWidthCm, ...size } = sizesFrom(
    record.Dimensions,
    info.width / info.height,
  );
  // Labels are HTML fragments (<P>, <i>) with stray CRLFs.
  const label = String(record.Label ?? "").replace(/\r/g, "");

  return {
    source,
    museum,
    city,
    objectId,
    sourceUrl,
    title: oneLine(title) || "Untitled",
    ...makersOf(record),
    date: enDash(record.Dated || years.join("-")),
    medium: oneLine(record.Medium),
    ...size,
    creditLine: oneLine(record.CreditLine) || null,
    accession: oneLine(record.ObjectNumber) || null,
    description: htmlToText(label),
    publicDomain: rights ? rights === "Public Domain" : null,
    imageUrl: iiifUrl(primary),
    framedImageUrl: framed ? iiifUrl(framed) : null,

    // PMA extras. `location` is the gallery the work hangs in while on view,
    // `rights` the museum's rights category as written, the framed sizes the
    // outside of the real frame, and `alternateImageUrls` every other
    // published view in the museum's order (usually just the verso).
    location: oneLine(record.Gallery) || null,
    rights,
    framedHeightCm,
    framedWidthCm,
    alternateImageUrls: alternates.map(iiifUrl),
  };
}
