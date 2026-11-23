/** The cloths the library is bound in (see CLOTHS in constants/books.ts). */
export type ClothName =
  | "oxblood"
  | "claret"
  | "brick"
  | "pumpkin"
  | "ochre"
  | "sand"
  | "bone"
  | "stone"
  | "sage"
  | "olive"
  | "forest"
  | "teal"
  | "sea"
  | "navy"
  | "plum"
  | "slate"
  | "ink";

/** What the lettering is stamped in. */
export type FoilName = "gold" | "silver" | "cream" | "ink";

export interface Book {
  id: string;
  title: string;
  author: string;
  /** The author as lettered on the spine, when the surname alone won't do. */
  spineAuthor?: string;
  readMoreUrl: string;
  publishedYear: string;
  /** How long it is. Sets the thickness when the printed one is not known. */
  wordCount: number;
  /**
   * The printed book in millimetres: the height and width of its cover and
   * the thickness of its spine. The shelf is drawn to these, so the books
   * are the right size beside one another.
   */
  height: number;
  width: number;
  thickness?: number;
  /** The edition those measurements are of. Not shown anywhere. */
  edition?: string;
  cloth: ClothName;
  foil: FoilName;
  /** A few words of my own about the book, shown beside it when present. */
  note?: string;
}
