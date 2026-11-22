// Shared helpers for the gallery source adapters.
//
// Every adapter in ./sources exports:
//
//   export const source  = "met";                 // short id, also the filename
//   export const museum  = "The Metropolitan Museum of Art";
//   export const city    = "New York";
//   export function match(url)  -> boolean        // does this adapter own the URL?
//   export async function resolve(url) -> Piece   // see the shape below
//
// Piece = {
//   source, museum, city,
//   objectId:      string,          // the museum's own id for the object
//   sourceUrl:     string,          // canonical public page for the object
//   title:         string,
//   artist:        string,
//   artistBio:     string | null,   // e.g. "Dutch, 1853–1890"
//   date:          string,          // display date, e.g. "1889" or "c. 1665"
//   medium:        string,
//   dimensions:    string | null,   // display string as the museum writes it
//   heightCm:      number | null,   // size of the work itself, unframed
//   widthCm:       number | null,
//   creditLine:    string | null,
//   accession:     string | null,
//   description:   string | null,   // the museum's own text, plain, "\n\n" between paragraphs
//   publicDomain:  boolean | null,  // null when the museum does not say
//   imageUrl:      string,          // largest practical JPEG of the work (unframed)
//   framedImageUrl: string | null,  // a museum photo of the work in its frame, if published
// }

export const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(url, init = {}, tries = 4) {
  let lastError;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        ...init,
        headers: {
          "user-agent": UA,
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          ...(init.headers ?? {}),
        },
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`${res.status} for ${url}`);
        await sleep(1500 * (attempt + 1) ** 2);
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} for ${url}`);
      return res;
    } catch (error) {
      lastError = error;
      if (/^4\d\d for /.test(String(error.message))) throw error;
      await sleep(1500 * (attempt + 1) ** 2);
    }
  }
  throw lastError;
}

export async function fetchText(url, init, tries) {
  return (await fetchWithRetry(url, init, tries)).text();
}

export async function fetchJson(url, init, tries) {
  return (await fetchWithRetry(url, init, tries)).json();
}

export async function fetchBuffer(url, init, tries) {
  return Buffer.from(
    await (await fetchWithRetry(url, init, tries)).arrayBuffer(),
  );
}

/** Strip tags and collapse whitespace; keeps paragraph breaks as blank lines. */
export function htmlToText(html) {
  if (!html) return null;
  const text = String(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h\d)\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

/**
 * Pull "H × W cm" out of a museum dimension string such as
 * `28 13/16 × 36 3/4 in. (73.2 × 93.4 cm)`. Height comes first by convention.
 */
export function parseCm(dimensions) {
  if (!dimensions) return { heightCm: null, widthCm: null };
  const s = String(dimensions).replace(/,/g, ".");
  const cm = s.match(
    /(\d+(?:\.\d+)?)\s*(?:cm)?\s*[×xX]\s*(\d+(?:\.\d+)?)\s*cm/,
  );
  if (cm) return { heightCm: Number(cm[1]), widthCm: Number(cm[2]) };
  const inches = s.match(
    /(\d+(?:\s+\d+\/\d+)?(?:\.\d+)?)\s*(?:in\.?|")?\s*[×xX]\s*(\d+(?:\s+\d+\/\d+)?(?:\.\d+)?)\s*(?:in\.?|")/,
  );
  if (inches) {
    const toNumber = (v) => {
      const [whole, frac] = v.trim().split(/\s+/);
      if (!frac) return Number(whole);
      const [n, d] = frac.split("/").map(Number);
      return Number(whole) + n / d;
    };
    return {
      heightCm: Math.round(toNumber(inches[1]) * 25.4) / 10,
      widthCm: Math.round(toNumber(inches[2]) * 25.4) / 10,
    };
  }
  return { heightCm: null, widthCm: null };
}
