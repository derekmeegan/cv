import frames from "@/data/gallery/frames.json";
import type { FrameSpec, FrameStyle, Piece } from "@/types/gallery";

/**
 * Hanging plan for the gallery, in the manner of the Barnes Foundation's
 * "ensembles": every wall is built around one large picture, with the rest
 * arranged in mirrored columns either side of it — smaller pictures stacked
 * above larger ones, ironwork above those.
 *
 * Everything here is in abstract wall units; the CSS scales a wall to fit
 * its container, so the same plan works at any width.
 */

export const FRAMES = frames as Record<FrameStyle, FrameSpec>;

export type IronKind =
  | "scroll"
  | "strap"
  | "key"
  | "fleur"
  | "ring"
  | "cock"
  | "latch"
  | "tongs";

export interface Hung {
  /** The piece's id. */
  id: string;
  /** Outer box (frame included), top-left corner. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Picture size inside the frame, and the frame's width. */
  pw: number;
  ph: number;
  bw: number;
}

export interface Iron {
  kind: IronKind;
  x: number;
  y: number;
  w: number;
  h: number;
  flip: boolean;
}

export interface Wall {
  id: string;
  width: number;
  height: number;
  pieces: Hung[];
  ironwork: Iron[];
}

type Sized = Omit<Hung, "x" | "y">;

/** Plans are computed once on the server; two decimals is plenty. */
const round = (v: number) => Math.round(v * 100) / 100;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Size on the wall. Real dimensions drive it, but compressed: a four-metre
 * history painting should dominate a Vermeer, not erase it.
 */
export function sizeOf(piece: Piece): Sized {
  const aspect = piece.image.width / piece.image.height;
  const area =
    piece.heightCm && piece.widthCm ? piece.heightCm * piece.widthCm : 80 * 80;
  const side = Math.sqrt(area);
  const mean = clamp(150 * Math.pow(side / 80, 0.6), 96, 300);
  const pw = mean * Math.sqrt(aspect);
  const ph = mean / Math.sqrt(aspect);

  // A museum photograph of the real frame: the box is simply that photo.
  if (piece.framed) {
    const grow =
      piece.framedWidthCm && piece.widthCm
        ? clamp(piece.framedWidthCm / piece.widthCm, 1.05, 1.9)
        : 1.3;
    const w = pw * grow;
    const h = (w * piece.framed.height) / piece.framed.width;
    return { id: piece.id, w, h, pw, ph, bw: (w - pw) / 2 };
  }

  const spec = FRAMES[piece.frame];
  let ratio = spec.width;
  if (
    piece.framedWidthCm &&
    piece.framedHeightCm &&
    piece.widthCm &&
    piece.heightCm
  ) {
    // The museum published the real frame's size: match its width, within
    // what this moulding can plausibly be.
    const real =
      (piece.framedWidthCm -
        piece.widthCm +
        (piece.framedHeightCm - piece.heightCm)) /
      4 /
      side;
    const visible = 1 - spec.margin / spec.slice;
    ratio = clamp(real / visible, spec.width * 0.7, spec.width * 1.35);
  }
  const bw = Math.max(ratio * mean, 11);
  return { id: piece.id, pw, ph, bw, w: pw + 2 * bw, h: ph + 2 * bw };
}

const IRON_SHAPES: Record<IronKind, { w: number; h: number }> = {
  scroll: { w: 110, h: 60 },
  strap: { w: 36, h: 110 },
  key: { w: 34, h: 92 },
  fleur: { w: 52, h: 100 },
  ring: { w: 68, h: 78 },
  cock: { w: 88, h: 106 },
  latch: { w: 84, h: 48 },
  tongs: { w: 42, h: 112 },
};

const CENTRE_IRON: IronKind[] = ["cock", "ring", "fleur", "tongs"];
const FLANK_IRON: IronKind[] = ["scroll", "strap", "latch", "key", "fleur"];

interface Column {
  /** Bottom-up: the main picture first, anything stacked above it after. */
  left: Sized[];
  right: Sized[];
}

function pairUp(rest: Sized[]) {
  const pool = [...rest];
  const pairs: [Sized, Sized][] = [];
  while (pool.length > 1) {
    const a = pool.shift()!;
    let best = 0;
    let bestCost = Infinity;
    pool.forEach((b, i) => {
      const cost =
        Math.abs(a.h - b.h) / Math.max(a.h, b.h) +
        Math.abs(a.w - b.w) / Math.max(a.w, b.w);
      if (cost < bestCost) {
        bestCost = cost;
        best = i;
      }
    });
    pairs.push([a, pool.splice(best, 1)[0]]);
  }
  return { pairs, single: pool[0] as Sized | undefined };
}

/**
 * Arrange the pieces into walls. `perSide` is how many columns flank the
 * centre picture: 2 for a wide wall, 1 for a narrow (phone) wall.
 */
export function hang(all: Piece[], perSide: 1 | 2): Wall[] {
  if (all.length === 0) return [];
  const gap = perSide === 2 ? 40 : 30;
  const stackGap = perSide === 2 ? 26 : 22;
  const ironGap = 20;

  const sized = all.map(sizeOf);
  const perWall = perSide === 2 ? 7 : 4.4;
  const wallCount = Math.max(1, Math.round(sized.length / perWall));

  const byArea = [...sized].sort((a, b) => b.w * b.h - a.w * a.h);
  const centres = byArea.slice(0, wallCount);
  const { pairs, single } = pairUp(byArea.slice(wallCount));

  // Deal the pairs round the walls, largest first, so every wall gets its
  // main flanking pair before any wall gets a second.
  const dealt: [Sized, Sized][][] = centres.map(() => []);
  pairs.forEach((pair, i) => dealt[i % wallCount].push(pair));

  return centres.map((centre, index) => {
    const columns: Column[] = [];
    dealt[index].forEach((pair, i) => {
      // Alternate which side gets the slightly larger of the two.
      const [l, r] = (i + index) % 2 === 0 ? pair : [pair[1], pair[0]];
      if (i < perSide) {
        columns.push({ left: [l], right: [r] });
      } else {
        const target = columns[(i - perSide) % columns.length];
        target.left.push(l);
        target.right.push(r);
      }
    });

    const pieces: Hung[] = [];
    const ironwork: Iron[] = [];
    const place = (s: Sized, cx: number, cy: number) =>
      pieces.push({ ...s, x: cx - s.w / 2, y: cy - s.h / 2 });
    const iron = (kind: IronKind, cx: number, bottom: number, flip = false) => {
      const shape = IRON_SHAPES[kind];
      ironwork.push({
        kind,
        x: cx - shape.w / 2,
        y: bottom - shape.h,
        w: shape.w,
        h: shape.h,
        flip,
      });
    };

    // Centre picture on the wall's midline, with the odd piece out (if any)
    // above the last wall's centre.
    place(centre, 0, 0);
    let centreTop = -centre.h / 2;
    if (single && index === wallCount - 1) {
      place(single, 0, centreTop - stackGap - single.h / 2);
      centreTop -= stackGap + single.h;
    }
    iron(CENTRE_IRON[index % CENTRE_IRON.length], 0, centreTop - ironGap);

    let edge = centre.w / 2;
    columns.forEach((column, c) => {
      const width = Math.max(
        ...column.left.map((s) => s.w),
        ...column.right.map((s) => s.w),
      );
      const cx = edge + gap + width / 2;
      edge += gap + width;

      // Both sides share each row's height so the wall stays symmetrical.
      let top = 0;
      column.left.forEach((l, row) => {
        const r = column.right[row];
        const rowH = Math.max(l.h, r.h);
        const cy = row === 0 ? 0 : top - stackGap - rowH / 2;
        place(l, -cx, cy);
        place(r, cx, cy);
        top = cy - rowH / 2;
      });

      const kind = FLANK_IRON[(index * 2 + c) % FLANK_IRON.length];
      iron(kind, -cx, top - ironGap, false);
      iron(kind, cx, top - ironGap, true);
    });

    const boxes = [...pieces, ...ironwork];
    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    boxes.forEach((b) => {
      b.x = round(b.x - minX);
      b.y = round(b.y - minY);
      b.w = round(b.w);
      b.h = round(b.h);
    });
    pieces.forEach((hung) => {
      hung.pw = round(hung.pw);
      hung.ph = round(hung.ph);
      hung.bw = round(hung.bw);
    });

    return {
      id: `wall-${perSide}-${index + 1}`,
      width: round(maxX - minX),
      height: round(maxY - minY),
      // reading order: left to right, top to bottom
      pieces: pieces.sort((a, b) => a.x - b.x || a.y - b.y),
      ironwork,
    };
  });
}
