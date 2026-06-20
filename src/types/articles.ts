export interface Article {
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
}

export interface RSSResponse {
  items: Article[];
}
