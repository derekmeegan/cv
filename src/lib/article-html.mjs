// Turns an article's HTML into the block list the site renders (see
// src/types/articles.ts). Plain JavaScript so that both the site and
// scripts/articles/sync.mjs can use it.
import { parseFragment } from "parse5";

/**
 * @typedef {import("../types/articles").Block} Block
 * @typedef {import("../types/articles").Inline} Inline
 * @typedef {import("../types/articles").Article} Article
 * @typedef {import("../types/articles").FeedItem} FeedItem
 */

// Medium's two heading sizes arrive as h3 and h4.
const HEADING_LEVELS = {
  medium: { h3: 2, h4: 3 },
  default: { h1: 2, h2: 2, h3: 3, h4: 3, h5: 3, h6: 3 },
};

const MARKS = { strong: "strong", b: "strong", em: "em", i: "em" };
const CONTAINERS = new Set([
  "div",
  "section",
  "article",
  "main",
  "header",
  "span",
  "center",
]);

const attr = (node, name) =>
  node.attrs?.find((a) => a.name === name)?.value ?? null;

const hasClass = (node, name) =>
  (attr(node, "class") ?? "").split(/[\s|]+/).includes(name);

/** Every descendant, depth first. */
function* walk(node) {
  for (const child of node.childNodes ?? []) {
    yield child;
    yield* walk(child);
  }
}

const find = (node, test) => {
  for (const child of walk(node)) if (test(child)) return child;
  return null;
};

/** Text as written, with <br> as a newline: for code. */
function rawText(node) {
  if (node.nodeName === "#text") return node.value;
  if (node.nodeName === "br") return "\n";
  return (node.childNodes ?? []).map(rawText).join("");
}

/** @returns {Inline[]} */
function inlines(nodes) {
  /** @type {Inline[]} */
  const out = [];
  const push = (item) => {
    const last = out[out.length - 1];
    if (typeof item === "string" && typeof last === "string") {
      out[out.length - 1] = last + item;
    } else {
      out.push(item);
    }
  };
  for (const node of nodes) {
    const tag = node.nodeName;
    if (tag === "#text") {
      // ordinary HTML whitespace collapses; non-breaking spaces are kept
      push(node.value.replace(/[ \t\r\n\f]+/g, " "));
    } else if (tag === "br") {
      push({ type: "break" });
    } else if (tag === "a") {
      const href = attr(node, "href");
      const children = inlines(node.childNodes);
      if (href && /^(https?:|mailto:|\/)/.test(href)) {
        push({ type: "link", href, children });
      } else {
        children.forEach(push);
      }
    } else if (tag in MARKS) {
      const children = inlines(node.childNodes);
      if (children.length) push({ type: MARKS[tag], children });
    } else if (tag === "code") {
      push({ type: "code", text: rawText(node) });
    } else if (
      node.childNodes &&
      !["img", "svg", "script", "style"].includes(tag)
    ) {
      inlines(node.childNodes).forEach(push);
    }
  }
  return out;
}

/** Drops leading and trailing blank space and breaks. */
function trimInlines(/** @type {Inline[]} */ items) {
  const out = [...items];
  const blank = (item) =>
    (typeof item === "string" && !item.trim()) ||
    (typeof item === "object" && item.type === "break");
  while (out.length && blank(out[0])) out.shift();
  while (out.length && blank(out[out.length - 1])) out.pop();
  if (typeof out[0] === "string") out[0] = out[0].trimStart();
  const end = out.length - 1;
  if (typeof out[end] === "string") out[end] = out[end].trimEnd();
  return out;
}

/** Inline content of an element whose children may be wrapped in <p>. */
function flowInlines(node) {
  const paragraphs = node.childNodes.filter((c) => c.nodeName === "p");
  if (!paragraphs.length) return trimInlines(inlines(node.childNodes));
  return paragraphs.flatMap((p, i) => [
    ...(i ? [{ type: "break" }, { type: "break" }] : []),
    ...trimInlines(inlines(p.childNodes)),
  ]);
}

function image(img, figure) {
  const src = attr(img, "src");
  // Medium ends every post with a one-pixel tracker.
  if (!src || /\/_\/stat\?/.test(src) || attr(img, "width") === "1")
    return null;
  const number = (name) => Number(attr(img, name)) || undefined;
  const caption = figure && find(figure, (n) => n.nodeName === "figcaption");
  const captionInlines = caption
    ? trimInlines(inlines(caption.childNodes))
    : [];
  return {
    type: "image",
    src,
    alt: attr(img, "alt") ?? "",
    width: number("width"),
    height: number("height"),
    ...(captionInlines.length ? { caption: captionInlines } : {}),
  };
}

/**
 * @param {string} html
 * @param {{ source?: "medium" | "browserbase", skipClass?: string }} [options]
 * @returns {Block[]}
 */
export function htmlToBlocks(html, options = {}) {
  const levels = HEADING_LEVELS[options.source] ?? HEADING_LEVELS.default;
  /** @type {Block[]} */
  const blocks = [];

  const visit = (nodes) => {
    for (const node of nodes) {
      const tag = node.nodeName;
      if (options.skipClass && hasClass(node, options.skipClass)) continue;

      if (tag === "#text") {
        const text = node.value.replace(/\s+/g, " ").trim();
        if (text) blocks.push({ type: "paragraph", children: [text] });
      } else if (tag === "p") {
        const img = find(node, (n) => n.nodeName === "img");
        const children = trimInlines(inlines(node.childNodes));
        if (children.length) blocks.push({ type: "paragraph", children });
        else if (img) {
          const block = image(img, null);
          if (block) blocks.push(block);
        }
      } else if (/^h[1-6]$/.test(tag)) {
        const children = trimInlines(inlines(node.childNodes));
        if (children.length) {
          blocks.push({ type: "heading", level: levels[tag] ?? 3, children });
        }
      } else if (tag === "ul" || tag === "ol") {
        const items = node.childNodes
          .filter((c) => c.nodeName === "li")
          .map(flowInlines)
          .filter((item) => item.length);
        if (items.length) {
          blocks.push({ type: "list", ordered: tag === "ol", items });
        }
      } else if (tag === "blockquote") {
        const children = flowInlines(node);
        if (children.length) blocks.push({ type: "quote", children });
      } else if (tag === "pre") {
        const code = find(node, (n) => n.nodeName === "code");
        const language = (attr(code ?? node, "class") ?? "").match(
          /language-([\w-]+)/,
        )?.[1];
        blocks.push({
          type: "code",
          ...(language && language !== "text" ? { language } : {}),
          code: rawText(node).replace(/\n+$/, ""),
        });
      } else if (tag === "figure") {
        const img = find(node, (n) => n.nodeName === "img");
        const frame = find(node, (n) => n.nodeName === "iframe");
        const block = img && image(img, node);
        if (block) blocks.push(block);
        else if (frame && attr(frame, "src")) {
          blocks.push({ type: "embed", url: attr(frame, "src") });
        } else visit(node.childNodes);
      } else if (tag === "img") {
        const block = image(node, null);
        if (block) blocks.push(block);
      } else if (tag === "iframe") {
        if (attr(node, "src")) {
          blocks.push({ type: "embed", url: attr(node, "src") });
        }
      } else if (tag === "hr") {
        blocks.push({ type: "rule" });
      } else if (CONTAINERS.has(tag)) {
        visit(node.childNodes);
      } else if (node.childNodes && !["script", "style", "svg"].includes(tag)) {
        // anything unexpected (a table, say): keep its words at least
        const children = trimInlines(inlines(node.childNodes));
        if (children.length) blocks.push({ type: "paragraph", children });
      }
    }
  };

  visit(parseFragment(html).childNodes);
  return blocks;
}

/** The words of some inline content, without the markup. */
export function plainText(/** @type {Inline[]} */ items) {
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item.type === "break") return " ";
      if (item.type === "code") return item.text;
      return plainText(item.children);
    })
    .join("");
}

/**
 * "https://derekmeegan.medium.com/the-title-792384262f55?source=…" → "the-title".
 * Medium keeps this part of the address even when a title is edited.
 */
export function slugFromMediumLink(link) {
  const last = decodeURIComponent(
    new URL(link).pathname.split("/").pop() ?? "",
  );
  return last
    .replace(/-[0-9a-f]{8,}$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * One Medium feed entry as an article.
 * @param {FeedItem} item
 * @returns {Article}
 */
export function mediumArticle(item) {
  const url = new URL(item.link);
  url.search = "";
  return {
    slug: slugFromMediumLink(item.link),
    title: item.title,
    source: "medium",
    url: url.toString(),
    // the feed gives UTC without saying so
    pubDate: /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(item.pubDate)
      ? `${item.pubDate.replace(" ", "T")}Z`
      : item.pubDate,
    categories: item.categories ?? [],
    authors: [item.author || "Derek Meegan"],
    blocks: htmlToBlocks(item.content, { source: "medium" }),
  };
}
