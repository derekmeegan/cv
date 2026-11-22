export type FrameStyle =
  | "louis"
  | "rocaille"
  | "salon"
  | "dutch"
  | "cassetta"
  | "reeded"
  | "plain";

export interface PieceImage {
  src: string;
  width: number;
  height: number;
  /** Average colour of the picture. */
  color?: string;
}

/** One artwork, as written by `pnpm gallery:sync` into pieces.json. */
export interface Piece {
  id: string;
  source: string;
  museum: string;
  city: string;
  /** The link as listed in links.json. */
  link: string;
  /** Canonical page for the work on the museum's site. */
  url: string;
  title: string;
  artist: string;
  artistBio: string | null;
  date: string;
  medium: string;
  dimensions: string | null;
  heightCm: number | null;
  widthCm: number | null;
  /** Outside size of the real frame, when the museum publishes it. */
  framedHeightCm: number | null;
  framedWidthCm: number | null;
  creditLine: string | null;
  accession: string | null;
  /** Where it hangs (a Barnes wall, a Getty building). */
  location: string | null;
  /** The museum's own text about the work. */
  description: string | null;
  /** Your own note; shown instead of the museum text when present. */
  about: string | null;
  imageCredit: string | null;
  frame: FrameStyle;
  image: PieceImage;
  /** Museum photograph of the work in its real frame, background removed. */
  framed?: PieceImage | null;
}

export interface FrameSpec {
  /** Corner size of the 9-slice texture, in texture pixels. */
  slice: number;
  size: number;
  /** Transparent margin around the moulding, in texture pixels. */
  margin: number;
  /** Frame width as a fraction of the picture's mean side. */
  width: number;
  centres: boolean;
  /** Length of a centre ornament, in frame widths. */
  centreLength: number;
}
