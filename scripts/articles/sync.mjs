#!/usr/bin/env node
// Captures my articles into the repo so /writing can render them itself.
//
//   pnpm articles:sync
//
// Reads src/data/articles/links.json and writes, next to it:
//
//   browserbase.json   The copy of each Browserbase post listed there. Their
//                      blog has no feed, so this file is the only place the
//                      site gets them from. In-body images are saved under
//                      public/images/articles/<slug>/.
//   medium.json        A snapshot of the Medium feed. The site reads the live
//                      feed when it builds, so a new post shows up without
//                      running this; the snapshot is there for when the feed
//                      cannot be reached, and for posts that have dropped off
//                      it (Medium's feed only carries the latest ten).
//
// Both files are plain data: the text can be edited by hand afterwards, and
// a later run only replaces articles it fetches again.

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "parse5";
import sharp from "sharp";

import { htmlToBlocks, mediumArticle } from "../../src/lib/article-html.mjs";
import { fetchBuffer, fetchJson, fetchText } from "../gallery/lib.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const DATA = path.join(ROOT, "src/data/articles");
const IMAGES = path.join(ROOT, "public/images/articles");
const IMAGE_WIDTH = 1600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : fallback;
}

/** New articles replace old ones with the same slug; the rest are kept. */
function merge(previous, fresh) {
  const bySlug = new Map(previous.map((a) => [a.slug, a]));
  for (const article of fresh) bySlug.set(article.slug, article);
  return [...bySlug.values()].sort((a, b) =>
    b.pubDate.localeCompare(a.pubDate),
  );
}

// --- Medium -----------------------------------------------------------------

async function medium(feedUrl) {
  const feed = await fetchJson(
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`,
  );
  if (feed.status !== "ok") throw new Error(`Medium feed: ${feed.message}`);
  const articles = feed.items.map(mediumArticle);

  // Medium does not say how big its images are; knowing lets the page keep
  // their place while they load. Measured on a large rendition, so a picture
  // is never shown smaller than it really is.
  for (const article of articles) {
    for (const block of article.blocks) {
      if (block.type !== "image") continue;
      try {
        const large = block.src.replace(/\/max\/\d+\//, "/max/1600/");
        const meta = await sharp(await fetchBuffer(large)).metadata();
        block.width = meta.width;
        block.height = meta.height;
      } catch (error) {
        console.warn(`  ! could not size ${block.src}: ${error.message}`);
      }
      await sleep(150);
    }
    console.log(`  ✓ ${article.title}`);
  }
  return articles;
}

// --- Browserbase ------------------------------------------------------------

const attr = (node, name) =>
  node.attrs?.find((a) => a.name === name)?.value ?? null;
const hasClass = (node, name) =>
  (attr(node, "class") ?? "").split(/[\s|]+/).includes(name);

function* walk(node) {
  for (const child of node.childNodes ?? []) {
    yield child;
    yield* walk(child);
  }
}
const all = (node, test) => [...walk(node)].filter(test);
const text = (node) =>
  node.nodeName === "#text"
    ? node.value
    : (node.childNodes ?? []).map(text).join("");

/** Re-serialises a node's children; parse5 has no innerHTML. */
async function innerHtml(node) {
  const { serialize } = await import("parse5");
  return serialize(node);
}

async function browserbase(url) {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
  const document = parse(await fetchText(url));
  const post = all(
    document,
    (n) => n.nodeName === "article" && hasClass(n, "post"),
  )[0];
  if (!post) throw new Error(`No article found at ${url}`);

  const one = (test) => all(post, test)[0];
  const title = text(one((n) => n.nodeName === "h1")).trim();
  const pubDate = attr(
    one((n) => n.nodeName === "time"),
    "datetime",
  );
  const authors = all(
    post,
    (n) => attr(n, "data-pagefind-meta") === "author",
  ).map((n) => text(n).trim());
  const tags = all(post, (n) => hasClass(n, "tag__label")).map((n) =>
    text(n).trim(),
  );
  const body = one((n) => hasClass(n, "post-text"));
  if (!title || !pubDate || !body) {
    throw new Error(`The page at ${url} is not laid out as expected`);
  }

  // Everything in the body except the sign-up banner at its foot.
  const blocks = htmlToBlocks(await innerHtml(body), {
    source: "browserbase",
    skipClass: "post-cta",
  });

  // Keep a copy of each picture, so the article does not depend on their CDN.
  let n = 0;
  for (const block of blocks) {
    if (block.type !== "image") continue;
    n += 1;
    const source = new URL(block.src);
    source.search = `?w=${IMAGE_WIDTH}&fit=max&fm=png`;
    const output = await sharp(await fetchBuffer(source.toString()))
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    await mkdir(path.join(IMAGES, slug), { recursive: true });
    await writeFile(path.join(IMAGES, slug, `${n}.webp`), output.data);
    block.src = `/images/articles/${slug}/${n}.webp`;
    block.width = output.info.width;
    block.height = output.info.height;
    await sleep(300);
  }

  console.log(`  ✓ ${title} (${blocks.length} blocks, ${n} images)`);
  return {
    slug,
    title,
    source: "browserbase",
    url,
    pubDate,
    categories: ["Browserbase", ...tags],
    authors,
    blocks,
  };
}

// --- run --------------------------------------------------------------------

const links = await readJson(path.join(DATA, "links.json"), {});
let failed = false;

async function update(name, work) {
  const file = path.join(DATA, `${name}.json`);
  try {
    const fresh = await work();
    const merged = merge(await readJson(file, []), fresh);
    await writeFile(file, `${JSON.stringify(merged, null, 2)}\n`);
    console.log(`${merged.length} articles in ${path.relative(ROOT, file)}\n`);
  } catch (error) {
    failed = true;
    console.error(`  ✗ ${name}: ${error.message}\n`);
  }
}

console.log("Browserbase");
await update("browserbase", async () => {
  const articles = [];
  for (const url of links.browserbase ?? []) {
    articles.push(await browserbase(url));
    await sleep(1000);
  }
  return articles;
});

console.log("Medium");
await update("medium", () => medium(links.medium));

if (failed) process.exitCode = 1;
