/** Text inside a paragraph, heading, list item, quote or caption. */
export type Inline =
  | string
  | { type: "strong" | "em"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "break" };

/** One piece of an article's body, in reading order. */
export type Block =
  | { type: "paragraph"; children: Inline[] }
  | { type: "heading"; level: 2 | 3; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; children: Inline[] }
  | { type: "code"; language?: string; code: string }
  | {
      type: "image";
      src: string;
      alt: string;
      width?: number;
      height?: number;
      caption?: Inline[];
    }
  | { type: "embed"; url: string }
  | { type: "rule" };

export type ArticleSource = "medium" | "browserbase";

export interface Article {
  /** The address on this site: /writing/<slug>. */
  slug: string;
  title: string;
  source: ArticleSource;
  /** Where it was first published. */
  url: string;
  /** "YYYY-MM-DD", or a full timestamp. */
  pubDate: string;
  categories: string[];
  authors: string[];
  /**
   * The picture that stands for the article on /writing and in link
   * previews, when that is not simply the first image in its body.
   */
  cover?: { src: string; width: number; height: number };
  blocks: Block[];
}

/** One entry of the Medium feed, as rss2json returns it. */
export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  categories: string[];
  content: string;
}

export interface RSSResponse {
  status?: string;
  items?: FeedItem[];
}
