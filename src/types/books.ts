export interface Book {
  id: string;
  title: string;
  author: string;
  readMoreUrl: string;
  publishedYear: string;
  wordCount: number;
  offset: number;
  coverGradient: string;
}

export interface BookStack {
  id: string;
  label: string;
  books: Book[];
}
