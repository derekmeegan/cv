// The Metropolitan Museum of Art — uses the public Open Access API.
// https://metmuseum.github.io/
import { fetchJson, fetchText, htmlToText, parseCm } from "../lib.mjs";

export const source = "met";
export const museum = "The Metropolitan Museum of Art";
export const city = "New York";

const API = "https://collectionapi.metmuseum.org/public/collection/v1/objects";

export function match(url) {
  return /(^|\.)metmuseum\.org$/.test(new URL(url).hostname);
}

function objectIdFromUrl(url) {
  const id = new URL(url).pathname.match(/\/(?:search|objects)\/(\d+)/)?.[1];
  if (!id) throw new Error(`No Met object id in ${url}`);
  return id;
}

// The API has no curatorial text, so try the public page for it. The page is
// rate limited fairly hard, so a miss here is not an error.
async function descriptionFor(objectId) {
  try {
    const html = await fetchText(
      `https://www.metmuseum.org/art/collection/search/${objectId}`,
      {},
      2,
    );
    const meta = html.match(
      /<meta[^>]+(?:name|property)="(?:og:)?description"[^>]+content="([^"]+)"/i,
    )?.[1];
    return htmlToText(meta);
  } catch {
    return null;
  }
}

export async function resolve(url) {
  const objectId = objectIdFromUrl(url);
  const data = await fetchJson(`${API}/${objectId}`);

  if (!data.primaryImage) {
    throw new Error(
      `Met object ${objectId} has no open-access image (isPublicDomain=${data.isPublicDomain})`,
    );
  }

  const measured = (name) =>
    data.measurements?.find((m) => m.elementName === name)?.elementMeasurements;
  const overall = measured("Overall");
  // Some records give the size of the real frame as well, either as a
  // measurement or on a "Framed:" line of the dimensions text.
  const [unframedText, framedText] = String(data.dimensions ?? "").split(
    /\s*Framed:\s*/i,
  );
  const parsed = parseCm(unframedText);
  const framed = measured("Framed") ?? measured("Frame");
  const framedParsed = parseCm(framedText);

  return {
    source,
    museum,
    city,
    objectId,
    sourceUrl: `https://www.metmuseum.org/art/collection/search/${objectId}`,
    title: data.title,
    artist: data.artistDisplayName || data.culture || "Unknown",
    artistBio: data.artistDisplayBio || null,
    date: data.objectDate || "",
    medium: data.medium || "",
    dimensions: unframedText?.trim() || null,
    heightCm: overall?.Height ?? parsed.heightCm,
    widthCm: overall?.Width ?? parsed.widthCm,
    framedHeightCm: framed?.Height ?? framedParsed.heightCm,
    framedWidthCm: framed?.Width ?? framedParsed.widthCm,
    creditLine: data.creditLine || null,
    accession: data.accessionNumber || null,
    description: await descriptionFor(objectId),
    publicDomain: Boolean(data.isPublicDomain),
    imageUrl: data.primaryImage,
    framedImageUrl: null,
  };
}
