import { BOOKS, CLOTHS, FOILS } from "@/constants/books";
import type { Book } from "@/types/books";

/**
 * How each book is bound: its size, and how the lettering is fitted to its
 * spine and its front board. Everything is in abstract units that the CSS
 * multiplies by --u (see library.css), so a book on the shelf and the same
 * book in the hand are one drawing at two sizes.
 */

/**
 * A spine thinner than this cannot be lettered, so the slimmest books are
 * drawn a little thicker than they are.
 */
const THINNEST = 11;

export interface SpinePlan {
  /** the title, already broken into the lines it is lettered in */
  lines: string[];
  /** font size of the title */
  size: number;
  /** the author's name, when there is room for it at the foot */
  author: string | null;
}

export interface Bound {
  book: Book;
  /** where it stands, counting along the shelf */
  index: number;
  h: number;
  w: number;
  /** thickness: longer books are thicker */
  t: number;
  cloth: string;
  foil: string;
  spine: SpinePlan;
  /** font size of the title on the front board */
  coverSize: number;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * The width of a string in ems. Nothing is measured in a browser — the
 * lettering has to be planned on the server too — so this is a table of
 * rough widths for the site's typeface at a semibold weight. It errs wide.
 */
function ems(text: string) {
  let total = 0;
  for (const char of text) {
    if (char === " ") total += 0.27;
    else if ("iljI.,:;'’!|".includes(char)) total += 0.3;
    else if ("ftr-".includes(char)) total += 0.4;
    else if ("mw".includes(char)) total += 0.9;
    else if ("MW".includes(char)) total += 0.97;
    else if (char >= "A" && char <= "Z") total += 0.7;
    else total += 0.59;
  }
  return total;
}

/** The two-line break that leaves the lines closest in length. */
function halves(title: string) {
  const words = title.split(" ");
  let best: [string, string] | null = null;
  let bestLength = Infinity;
  for (let i = 1; i < words.length; i++) {
    const pair: [string, string] = [
      words.slice(0, i).join(" "),
      words.slice(i).join(" "),
    ];
    const length = Math.max(ems(pair[0]), ems(pair[1]));
    if (length < bestLength) {
      best = pair;
      bestLength = length;
    }
  }
  return best ? { lines: best, length: bestLength } : null;
}

const AUTHOR_SIZE = 6.2;

function planSpine(book: Book, h: number, t: number): SpinePlan {
  // what is left for lettering below the rules at the head
  const room = h - 17 - 13;
  const name = filedUnder(book);
  // capitals, widely spaced
  const nameLength =
    (ems(name.toUpperCase()) + name.length * 0.14) * AUTHOR_SIZE;
  const withName = room - nameLength - 12;

  const size = clamp(t * 0.44, 6.6, 12.5);
  const one = ems(book.title);
  const two = halves(book.title);
  const twoSize = Math.min(size, (t - 4) / 2.25);

  if (one * size <= withName) {
    return { lines: [book.title], size, author: name };
  }
  if (two && twoSize >= 6.2 && two.length * twoSize <= withName) {
    return { lines: two.lines, size: twoSize, author: name };
  }
  if (one * size <= room) {
    return { lines: [book.title], size, author: null };
  }
  if (two && twoSize >= 6.2 && two.length * twoSize <= room) {
    return { lines: two.lines, size: twoSize, author: null };
  }
  // nothing else for it: letter it smaller
  return {
    lines: [book.title],
    size: Math.max(5.6, room / one),
    author: null,
  };
}

/** How many lines a title takes at a size, in a column `width` wide. */
function linesAt(title: string, size: number, width: number) {
  let lines = 1;
  let run = 0;
  for (const word of title.split(" ")) {
    const length = ems(word) * size;
    if (length > width) return Infinity;
    const next = run ? run + 0.27 * size + length : length;
    if (next > width) {
      lines += 1;
      run = length;
    } else {
      run = next;
    }
  }
  return lines;
}

/** The largest size at which the title sits on the board in a few lines. */
function planCover(book: Book, w: number) {
  const column = w - 44;
  let size = 25;
  while (size > 10 && linesAt(book.title, size, column) > 4) size -= 0.5;
  return size;
}

/**
 * How thick a book of so many words would be, for the few whose printed
 * thickness is not on record: about 300 words to a page, sixteen pages to a
 * millimetre, and the covers.
 */
function thicknessOf(words: number) {
  return words / 300 / 16 + 3;
}

function bind(book: Book, index: number): Bound {
  const h = book.height;
  const w = book.width;
  const t = Math.max(
    THINNEST,
    Math.round(book.thickness ?? thicknessOf(book.wordCount)),
  );
  return {
    book,
    index,
    h,
    w,
    t,
    cloth: CLOTHS[book.cloth],
    foil: FOILS[book.foil],
    spine: planSpine(book, h, t),
    coverSize: planCover(book, w),
  };
}

/** The name a book is filed under: the one lettered on its spine. */
function filedUnder(book: Book) {
  return book.spineAuthor ?? book.author.split(" ").pop() ?? book.author;
}

/** Every book, bound, in the order it stands: by author, then by title. */
export const BOUND = [...BOOKS]
  .sort(
    (a, b) =>
      filedUnder(a).localeCompare(filedUnder(b), "en", {
        sensitivity: "base",
      }) || a.title.localeCompare(b.title, "en"),
  )
  .map(bind);

/** The tallest book: the shelf and the hand are sized against it. */
export const TALLEST = Math.max(...BOUND.map((bound) => bound.h));
