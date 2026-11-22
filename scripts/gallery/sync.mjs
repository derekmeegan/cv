#!/usr/bin/env node
// Turns the list of links in src/data/gallery/links.json into the data the
// /gallery page renders: src/data/gallery/pieces.json plus one resized image
// per piece in public/images/gallery/pieces/.
//
//   pnpm gallery:sync                 resolve anything new
//   pnpm gallery:sync --only irises   re-do entries whose link contains "irises"
//   pnpm gallery:sync --force         re-do everything
//
// An entry in links.json is either a bare URL or an object:
//
//   "https://www.metmuseum.org/art/collection/search/436535"
//
//   { "url": "...", "frame": "louis", "about": "Why I like it / what it is." }
//
//   frame      one of louis, rocaille, salon, dutch, cassetta, reeded, plain
//              (left out, one is chosen from the work's date and school)
//   about      your own words, shown in the close-up instead of the museum's
//   title, artist, date   your wording instead of the museum's
//   realFrame  when the museum publishes a photo of the work in its actual
//              frame, that photo is used. false = use a rendered frame
//              instead; "mask" = the frame has a carved, wavy outline
//
//   { "url": "https://www.famsf.org/artworks/...",       // any site at all
//     "piece": { "museum": "de Young", "city": "San Francisco",
//                "title": "...", "artist": "...", "date": "...",
//                "medium": "...", "dimensions": "... cm",
//                "imageUrl": "https://..." } }
//
// The third form is for museums this script cannot read (the de Young and the
// Legion of Honor sit behind a bot check): you give the facts and an image
// URL, the script still downloads and sizes the picture.

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import sharp from "sharp";

import { fetchBuffer, parseCm } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");

// One adapter per museum; drop a new file in ./sources to add another.
const ADAPTERS = await Promise.all(
  (await readdir(path.join(HERE, "sources")))
    .filter((file) => file.endsWith(".mjs"))
    .sort()
    .map((file) => import(pathToFileURL(path.join(HERE, "sources", file)))),
);
const LINKS = path.join(ROOT, "src/data/gallery/links.json");
const PIECES = path.join(ROOT, "src/data/gallery/pieces.json");
const IMAGE_DIR = path.join(ROOT, "public/images/gallery/pieces");
const IMAGE_URL = "/images/gallery/pieces";

const MAX_EDGE = 1800;
// Be a polite guest: museums rate-limit, and some show a bot check to
// anything that downloads quickly.
const PAUSE_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = [
  "louis",
  "rocaille",
  "salon",
  "dutch",
  "cassetta",
  "reeded",
  "plain",
];

const force = process.argv.includes("--force");
// --only <text>: re-do just the entries whose link contains <text>.
const onlyAt = process.argv.indexOf("--only");
const only = onlyAt > -1 ? process.argv[onlyAt + 1] : null;
// Originals are kept here (git-ignored) so a re-run never downloads a file
// twice; some are close to 100 MB.
const cacheDir =
  process.env.GALLERY_IMAGE_CACHE ?? path.join(ROOT, ".cache/gallery");

const slug = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const firstYear = (date) => {
  const m = String(date ?? "").match(/\d{4}/);
  return m ? Number(m[0]) : null;
};

/** A period-appropriate frame when the entry does not name one. */
function pickFrame(piece) {
  const year = firstYear(piece.date);
  const who = `${piece.artistBio ?? ""} ${piece.artist ?? ""}`.toLowerCase();
  const medium = String(piece.medium ?? "").toLowerCase();
  if (
    /print|woodblock|etching|engraving|lithograph|watercolou?r|pastel|drawing|paper|photograph/.test(
      medium,
    )
  ) {
    return "plain";
  }
  const lowlands = /dutch|flemish|netherland|german/.test(who);
  if (year && year < 1600) return lowlands ? "dutch" : "cassetta";
  if (year && year < 1700) {
    if (lowlands) return "dutch";
    return /italian|spanish|greek/.test(who) ? "cassetta" : "louis";
  }
  if (year && year < 1790) return "rocaille";
  if (year && year < 1860) return "louis";
  if (/american/.test(who)) return year && year >= 1880 ? "reeded" : "salon";
  if (year && year >= 1895) return "reeded";
  return "salon";
}

function sourceFor(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (/famsf\.org$/.test(host)) return "famsf";
  return host.split(".").slice(-2, -1)[0];
}

async function download(piece, url, suffix = "") {
  if (!/^https?:/.test(url)) return readFile(path.resolve(ROOT, url));
  const cached = path.join(
    cacheDir,
    `${piece.source}-${piece.objectId}${suffix}.jpg`,
  );
  if (existsSync(cached)) return readFile(cached);
  // An image host that answers with a web page is asking us to slow down:
  // wait and try again a couple of times before giving up.
  for (const wait of [20_000, 60_000, 0]) {
    const buffer = await fetchBuffer(url);
    try {
      assertImage(buffer, url);
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cached, buffer);
      return buffer;
    } catch (error) {
      if (!wait) throw error;
      console.log(
        `  … ${new URL(url).hostname} is busy, waiting ${wait / 1000}s`,
      );
      await sleep(wait);
    }
  }
}

function assertImage(buffer, from) {
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const png = buffer.subarray(1, 4).toString("latin1") === "PNG";
  const webp = buffer.subarray(8, 12).toString("latin1") === "WEBP";
  const tiff = ["II*\0", "MM\0*"].includes(
    buffer.subarray(0, 4).toString("latin1"),
  );
  if (jpeg || png || webp || tiff) return;
  const looksLikeHtml = /<html|<!doctype/i.test(
    buffer.subarray(0, 400).toString("latin1"),
  );
  throw new Error(
    looksLikeHtml
      ? `${new URL(from).hostname} sent a web page instead of the image (usually a rate limit or bot check). Wait a few minutes and run the sync again.`
      : `The file at ${from} is not an image this script can read.`,
  );
}

const resizeOptions = {
  width: MAX_EDGE,
  height: MAX_EDGE,
  fit: "inside",
  withoutEnlargement: true,
};

/** Raw RGB pixels of a small copy, for measuring borders and backdrops. */
async function probe(buffer, edge = 480) {
  const { data, info } = await sharp(buffer, { limitInputPixels: false })
    .rotate()
    .resize({ width: edge, height: edge, fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const peak = (x, y) => {
    const i = (y * width + x) * channels;
    return Math.max(data[i], data[i + 1], data[i + 2]);
  };
  return { width, height, peak };
}

/**
 * Marks the surround of a photograph: pixels that pass `isBackdrop` and are
 * connected to the edge of the image. A black dress or a dark sky inside the
 * picture is not surround, however black it is.
 */
function surround({ width, height, peak }, isBackdrop) {
  const mask = new Uint8Array(width * height);
  const stack = [];
  const visit = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (mask[p] || !isBackdrop(peak(x, y))) return;
    mask[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    visit(0, y);
    visit(width - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    visit(x + 1, (p - x) / width);
    visit(x - 1, (p - x) / width);
    visit(x, (p - x) / width + 1);
    visit(x, (p - x) / width - 1);
  }
  return (x, y) => mask[y * width + x] === 1;
}

/**
 * How far in from each side the picture starts, as fractions of the image
 * size. A side has a surround only if its outermost line is almost entirely
 * surround; from there we keep going while at least `keep` of each line is.
 */
function insets({ width, height }, isSurround, { limit, keep }) {
  const share = (count, at) => {
    let hits = 0;
    for (let i = 0; i < count; i++) if (at(i)) hits += 1;
    return hits / count;
  };
  const scan = (size, line) => {
    if (line(0) < 0.98) return 0;
    let n = 1;
    while (n < size * limit && line(n) >= keep) n += 1;
    return n / size;
  };
  return {
    top: scan(height, (y) => share(width, (x) => isSurround(x, y))),
    bottom: scan(height, (y) =>
      share(width, (x) => isSurround(x, height - 1 - y)),
    ),
    left: scan(width, (x) => share(height, (y) => isSurround(x, y))),
    right: scan(width, (x) =>
      share(height, (y) => isSurround(width - 1 - x, y)),
    ),
  };
}

/** Pixel rectangle left after taking `box` (fractions) off each side. */
async function regionFor(buffer, box) {
  const meta = await sharp(buffer, { limitInputPixels: false }).metadata();
  const turned = (meta.orientation ?? 1) >= 5;
  const fullWidth = turned ? meta.height : meta.width;
  const fullHeight = turned ? meta.width : meta.height;
  const left = Math.ceil(box.left * fullWidth);
  const top = Math.ceil(box.top * fullHeight);
  return {
    left,
    top,
    width: fullWidth - left - Math.ceil(box.right * fullWidth),
    height: fullHeight - top - Math.ceil(box.bottom * fullHeight),
  };
}

function open(buffer, region) {
  const image = sharp(buffer, { limitInputPixels: false }).rotate();
  return region ? image.extract(region) : image;
}

const hasInset = (box) => box.top + box.bottom + box.left + box.right > 0.004;

async function writeImage(id, original) {
  // Some museum photographs carry a flat black or white surround; a picture
  // on the wall should end where the canvas does.
  let region = null;
  const small = await probe(original);
  for (const isBackdrop of [(v) => v <= 14, (v) => v >= 244]) {
    // An unframed canvas is never quite square to the camera, so a line
    // counts as surround while most of it still is...
    const box = insets(small, surround(small, isBackdrop), {
      limit: 0.2,
      keep: 0.5,
    });
    if (hasInset(box)) {
      // ...and then take what a frame's rebate would cover: the tacking edge.
      for (const side of ["top", "right", "bottom", "left"]) {
        if (box[side]) box[side] += 0.008;
      }
      region = await regionFor(original, box);
      break;
    }
  }

  const resized = await open(original, region)
    .resize(resizeOptions)
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  await writeFile(path.join(IMAGE_DIR, `${id}.jpg`), resized.data);

  return describeImage(id);
}

/** Size and average colour of an already-written picture. */
async function describeImage(id) {
  const file = sharp(path.join(IMAGE_DIR, `${id}.jpg`));
  const { width, height } = await file.metadata();
  const { channels } = await file.stats();
  const hex = (channel) =>
    Math.round(channel.mean).toString(16).padStart(2, "0");
  return {
    src: `${IMAGE_URL}/${id}.jpg`,
    width,
    height,
    color: `#${channels.slice(0, 3).map(hex).join("")}`,
  };
}

/**
 * A museum photograph of the work in its real frame, shot against a dark
 * backdrop: cut the backdrop away so the frame can hang on the wall.
 *
 *  "rect"  — crop to the frame's rectangle (right for straight-sided frames)
 *  "mask"  — also clear the backdrop showing in a carved, scalloped outline
 */
async function writeFramed(id, original, mode) {
  const small = await probe(original, 640);
  const corners = [
    small.peak(2, 2),
    small.peak(small.width - 3, 2),
    small.peak(2, small.height - 3),
    small.peak(small.width - 3, small.height - 3),
  ].sort((a, b) => a - b);
  const backdrop = corners[1];
  if (backdrop > 70) {
    throw new Error("framed photo is not on a dark backdrop; skipping it");
  }
  const cut = backdrop + 20;
  const box = insets(small, (x, y) => small.peak(x, y) <= cut, {
    limit: 0.12,
    keep: 0.98,
  });
  // shave a hair more so no sliver of backdrop survives along an edge
  for (const side of ["top", "right", "bottom", "left"]) box[side] += 0.003;
  const region = await regionFor(original, box);

  const { data, info } = await open(original, region)
    .resize({ ...resizeOptions, width: 1600, height: 1600 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  if (mode === "mask") {
    // Flood in from the edges through backdrop-dark pixels, staying within a
    // band near the edge so dark passages of the picture are never touched.
    const reach = Math.round(Math.min(width, height) * 0.09);
    const dark = (p) =>
      Math.max(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) <= cut;
    const seen = new Uint8Array(width * height);
    const stack = [];
    const visit = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      if (Math.min(x, y, width - 1 - x, height - 1 - y) > reach) return;
      const p = y * width + x;
      if (seen[p] || !dark(p)) return;
      seen[p] = 1;
      stack.push(p);
    };
    for (let x = 0; x < width; x++) {
      visit(x, 0);
      visit(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      visit(0, y);
      visit(width - 1, y);
    }
    while (stack.length) {
      const p = stack.pop();
      const x = p % width;
      const y = (p - x) / width;
      visit(x + 1, y);
      visit(x - 1, y);
      visit(x, y + 1);
      visit(x, y - 1);
    }
    for (let p = 0; p < seen.length; p++) if (seen[p]) data[p * 4 + 3] = 0;
  }

  const output = await sharp(data, { raw: { width, height, channels: 4 } })
    .webp({ quality: 80, alphaQuality: 100, effort: 6 })
    .toBuffer();
  await writeFile(path.join(IMAGE_DIR, `${id}-framed.webp`), output);
  return { src: `${IMAGE_URL}/${id}-framed.webp`, width, height };
}

async function resolveEntry(entry) {
  const { url } = entry;
  if (entry.piece) {
    const given = entry.piece;
    const size = parseCm(given.dimensions);
    return {
      source: sourceFor(url),
      objectId: slug(`${given.artist}-${given.title}`),
      sourceUrl: url,
      artistBio: null,
      creditLine: null,
      accession: null,
      description: null,
      ...size,
      ...given,
    };
  }
  const adapter = ADAPTERS.find((a) => a.match(url));
  if (!adapter) {
    throw new Error(
      `No adapter for ${new URL(url).hostname}. Give the details by hand with a "piece" object (see the top of this file).`,
    );
  }
  return adapter.resolve(url);
}

async function main() {
  const links = JSON.parse(await readFile(LINKS, "utf8"));
  const previous = existsSync(PIECES)
    ? JSON.parse(await readFile(PIECES, "utf8"))
    : [];
  const byUrl = new Map(previous.map((p) => [p.link, p]));
  await mkdir(IMAGE_DIR, { recursive: true });

  const pieces = [];
  let failed = 0;
  let fetched = 0;

  for (const raw of links) {
    const entry = typeof raw === "string" ? { url: raw } : raw;
    const known = byUrl.get(entry.url);
    const haveImage =
      known &&
      existsSync(path.join(ROOT, "public", known.image.src)) &&
      // a changed "realFrame" setting needs the photo processed again
      (known.realFrame ?? null) === (entry.realFrame ?? null);

    let piece;
    const redo = force || (only && entry.url.includes(only));
    if (known && haveImage && !redo) {
      piece = { ...known };
    } else {
      try {
        if (fetched++) await sleep(PAUSE_MS);
        process.stdout.write(`resolving ${entry.url}\n`);
        const found = await resolveEntry(entry);
        if (found.publicDomain === false) {
          console.warn(
            `  ! ${found.title}: the museum marks this as in copyright — skipping the image is safest; remove it or replace the link.`,
          );
        }
        const id = `${found.source}-${slug(found.objectId)}`;
        let image;
        try {
          image = await writeImage(id, await download(found, found.imageUrl));
        } catch (error) {
          // Keep the picture already on disk rather than lose the piece.
          if (!existsSync(path.join(IMAGE_DIR, `${id}.jpg`))) throw error;
          console.warn(`  ! kept the existing image: ${error.message}`);
          image = await describeImage(id);
        }

        // The museum's photograph of the real frame, when it has one and
        // the entry does not opt out with "realFrame": false.
        let framed = null;
        if (found.framedImageUrl && entry.realFrame !== false) {
          try {
            framed = await writeFramed(
              id,
              await download(found, found.framedImageUrl, "-framed"),
              entry.realFrame === "mask" ? "mask" : "rect",
            );
          } catch (error) {
            console.warn(`  ! real frame not used: ${error.message}`);
          }
        }
        piece = {
          id,
          source: found.source,
          museum: found.museum,
          city: found.city,
          link: entry.url,
          url: found.sourceUrl,
          title: found.title,
          artist: found.artist,
          artistBio: found.artistBio ?? null,
          date: found.date ?? "",
          medium: found.medium ?? "",
          dimensions: found.dimensions ?? null,
          heightCm: found.heightCm ?? null,
          widthCm: found.widthCm ?? null,
          creditLine: found.creditLine ?? null,
          accession: found.accession ?? null,
          framedHeightCm: found.framedHeightCm ?? null,
          framedWidthCm: found.framedWidthCm ?? null,
          location: found.ensemble ?? found.venue ?? null,
          description: found.description ?? null,
          imageCredit: found.imageCredit ?? null,
          image,
          framed,
        };
        console.log(
          `  ✓ ${piece.artist}, ${piece.title} (${image.width}×${image.height})`,
        );
      } catch (error) {
        failed += 1;
        console.error(`  ✗ ${entry.url}\n    ${error.message}`);
        // A refresh that fails must not drop a piece that was fine before.
        if (!(known && haveImage)) continue;
        piece = { ...known };
      }
    }

    // Things you set in links.json always win, and can be changed without a
    // re-fetch.
    piece.about = entry.about ?? null;
    piece.realFrame = entry.realFrame ?? null;
    piece.frame = entry.frame ?? pickFrame(piece);
    for (const key of ["title", "artist", "date"]) {
      if (entry[key]) piece[key] = entry[key];
    }
    if (!FRAMES.includes(piece.frame)) {
      console.warn(`  ! unknown frame "${piece.frame}" for ${piece.title}`);
      piece.frame = pickFrame(piece);
    }
    pieces.push(piece);
  }

  await writeFile(PIECES, `${JSON.stringify(pieces, null, 2)}\n`);
  console.log(
    `\n${pieces.length} pieces written to ${path.relative(ROOT, PIECES)}${failed ? `, ${failed} failed` : ""}`,
  );
  if (failed) process.exitCode = 1;
}

await main();
