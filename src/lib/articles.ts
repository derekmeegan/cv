import browserbase from "@/data/articles/browserbase.json";
import mediumSnapshot from "@/data/articles/medium.json";
import { mediumArticle, plainText } from "@/lib/article-html.mjs";
import type { Article, Block, RSSResponse } from "@/types/articles";

const MEDIUM_FEED =
  "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@derekmeegan";

export function parseArticleDate(dateString: string): Date {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(dateString);
}

export function formatDate(dateString: string): string {
  const date = parseArticleDate(dateString);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const getOrdinal = (day: number): string => {
    if (day > 3 && day < 21) return "th";

    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${month} ${day}${getOrdinal(day)}, ${year}`;
}

export function orderArticlesChronologically<T extends { pubDate: string }>(
  articles: T[],
): T[] {
  return [...articles].sort(
    (a, b) =>
      parseArticleDate(b.pubDate).getTime() -
      parseArticleDate(a.pubDate).getTime(),
  );
}

/** The latest Medium posts, straight from the feed; empty if it is down. */
async function liveMedium(): Promise<Article[]> {
  try {
    const response = await fetch(MEDIUM_FEED, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const feed = (await response.json()) as RSSResponse;
    if (!feed.items?.length) throw new Error("the feed came back empty");
    return feed.items.map(mediumArticle);
  } catch (error) {
    console.warn(
      `Medium feed unavailable (${error instanceof Error ? error.message : error}); using the stored copy.`,
    );
    return [];
  }
}

async function load(): Promise<Article[]> {
  const stored = mediumSnapshot as unknown as Article[];
  const bySlug = new Map(stored.map((article) => [article.slug, article]));

  // The feed says nothing about image sizes; the stored copy knows them.
  const sizes = new Map<string, { width?: number; height?: number }>();
  for (const article of stored) {
    for (const block of article.blocks) {
      if (block.type === "image") sizes.set(block.src, block);
    }
  }

  // Whatever the feed has wins (new posts, edits); posts that have dropped
  // off it, or all of them if it cannot be reached, come from the stored copy.
  for (const article of await liveMedium()) {
    for (const block of article.blocks) {
      const known = block.type === "image" ? sizes.get(block.src) : null;
      if (block.type === "image" && known) {
        block.width = known.width;
        block.height = known.height;
      }
    }
    bySlug.set(article.slug, article);
  }

  return orderArticlesChronologically([
    ...bySlug.values(),
    ...(browserbase as unknown as Article[]),
  ]);
}

let loading: Promise<Article[]> | null = null;

/** Every article, newest first. Fetched once per build worker. */
export function getArticles(): Promise<Article[]> {
  loading ??= load();
  return loading;
}

function blockWords(block: Block): string {
  switch (block.type) {
    case "list":
      return block.items.map(plainText).join(" ");
    case "code":
      return block.code;
    case "image":
      return block.caption ? plainText(block.caption) : "";
    case "embed":
    case "rule":
      return "";
    default:
      return plainText(block.children);
  }
}

export function readingMinutes(article: Article): number {
  const words = article.blocks
    .map(blockWords)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/** The opening of the article, for link previews and search results. */
export function excerpt(article: Article, length = 170): string {
  const opening = article.blocks.find(
    (block) =>
      block.type === "paragraph" && plainText(block.children).length > 60,
  );
  const text =
    opening?.type === "paragraph"
      ? plainText(opening.children).replace(/\s+/g, " ").trim()
      : article.title;
  if (text.length <= length) return text;
  return `${text.slice(0, text.lastIndexOf(" ", length))}…`;
}

/** The picture for an article's card: its cover, else its first image. */
export function coverImage(
  article: Article,
): { src: string; alt: string; width?: number; height?: number } | null {
  if (article.cover) return { ...article.cover, alt: "" };
  const first = article.blocks.find((block) => block.type === "image");
  return first?.type === "image" ? first : null;
}

const SOURCE_NAMES = {
  medium: "Medium",
  browserbase: "the Browserbase blog",
} as const;

export function sourceName(article: Article): string {
  return SOURCE_NAMES[article.source];
}
