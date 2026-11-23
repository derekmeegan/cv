import frames from "@/data/gallery/frames.json";
import type { FrameSpec, FrameStyle, Piece } from "@/types/gallery";

/**
 * Hanging plan for the gallery, after the Paris Salon as Pietro Antonio
 * Martini engraved it in 1787: the wall covered from dado to cornice, frame
 * against frame.
 *
 * The Salon's logic, in order:
 *
 *  - Registers. Pictures hang in rows that run the full width of the wall,
 *    every picture in a row the same height.
 *  - Big pictures go high. The largest canvases are "skied" in the top
 *    register and the rows get shorter going down, so the small pictures end
 *    up low, where you can get close to them.
 *  - Small pictures double up. Pairs of little ones are stacked to fill a
 *    place among bigger neighbours.
 *  - Symmetry. Each row is arranged about the centre line: widest in the
 *    middle, the rest mirrored outwards.
 *  - A crown. Three tall pictures stand above the top register, on the
 *    centre line, the middle one tallest.
 *
 * Every picture keeps its own proportions throughout. Sizes are in abstract
 * wall units; CSS scales the wall to its container. The plan is computed
 * once, on the server.
 */

export const FRAMES = frames as Record<FrameStyle, FrameSpec>;

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

export interface Wall {
  id: string;
  width: number;
  height: number;
  pieces: Hung[];
}

export type Plan = "wide" | "narrow";

interface PlanSpec {
  width: number;
  /** Intended shape of the registers (crown excluded), width ÷ height. */
  aspect: number;
  /** Space between frames. */
  gap: number;
  /**
   * How strongly real size shows: the exponent on a work's side length, and
   * the smallest and largest it may count as (1 = an 80 cm picture).
   */
  contrast: number;
  smallest: number;
  largest: number;
  /** One stacked pair of small pictures for every this many pieces; 0 = none. */
  stackEvery: number;
}

const PLANS: Record<Plan, PlanSpec> = {
  // a broad wall: four or five registers under the crown
  wide: {
    width: 1500,
    aspect: 1.95,
    gap: 5,
    contrast: 0.62,
    smallest: 0.58,
    largest: 2.7,
    stackEvery: 8,
  },
  // a tall strip for phones, where nothing can afford to get tiny
  narrow: {
    width: 620,
    aspect: 0.43,
    gap: 4,
    contrast: 0.4,
    smallest: 0.74,
    largest: 1.9,
    stackEvery: 0,
  },
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const round = (v: number) => Math.round(v * 100) / 100;

/** What the packer needs to know about one framed picture. */
interface Shape {
  id: string;
  /** Outer box, width ÷ height. Fixed: a frame scales with its picture. */
  aspect: number;
  /** How much wall it should get, relative to the others. */
  weight: number;
  /** Picture size and frame width for a given outer width. */
  inside(w: number): { pw: number; ph: number; bw: number };
}

function shapeOf(piece: Piece, spec: PlanSpec): Shape {
  const ratio = piece.image.width / piece.image.height;
  const area =
    piece.heightCm && piece.widthCm ? piece.heightCm * piece.widthCm : 80 * 80;
  const side = Math.sqrt(area);
  // Real size drives the share of wall, but compressed: a four-metre history
  // painting should dominate a Vermeer, not erase it.
  const mean = clamp(
    Math.pow(side / 80, spec.contrast),
    spec.smallest,
    spec.largest,
  );

  // A museum photograph of the real frame: the box is simply that photo.
  if (piece.framed) {
    const outer = piece.framed.width / piece.framed.height;
    const grow =
      piece.framedWidthCm && piece.widthCm
        ? clamp(piece.framedWidthCm / piece.widthCm, 1.05, 1.9)
        : 1.3;
    const width = mean * Math.sqrt(ratio) * grow;
    return {
      id: piece.id,
      aspect: outer,
      weight: (width * width) / outer,
      inside(w) {
        const pw = w / grow;
        return { pw, ph: pw / ratio, bw: (w - pw) / 2 };
      },
    };
  }

  const moulding = FRAMES[piece.frame];
  let frame = moulding.width;
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
    const visible = 1 - moulding.margin / moulding.slice;
    frame = clamp(real / visible, moulding.width * 0.7, moulding.width * 1.35);
  }
  // In units of the picture's mean side: the picture is √ratio by 1/√ratio.
  const across = Math.sqrt(ratio) + 2 * frame;
  const down = 1 / Math.sqrt(ratio) + 2 * frame;
  return {
    id: piece.id,
    aspect: across / down,
    weight: mean * across * (mean * down),
    inside(w) {
      const unit = w / across;
      return {
        pw: unit * Math.sqrt(ratio),
        ph: unit / Math.sqrt(ratio),
        bw: unit * frame,
      };
    },
  };
}

// --- registers --------------------------------------------------------------

/**
 * One place in a row: a picture, or two small pictures stacked. Its width is
 * `p × height + q` (for a single picture simply aspect × height; a stack
 * loses the gap between its two pictures).
 */
interface Cell {
  /** Indices into the shapes, top first. */
  members: number[];
  p: number;
  q: number;
  /** The height it wants, relative to the other cells. */
  natural: number;
}

interface Row {
  cells: Cell[];
  height: number;
}

/**
 * Split the cells (tallest first) into consecutive rows. A row's height is
 * fixed by what is in it — it must span the wall — so this looks for the
 * split where every picture lands closest to the height it wants, at the
 * overall scale that gives a wall of about the intended height.
 */
function registers(cells: Cell[], spec: PlanSpec) {
  const { width, gap } = spec;
  const targetHeight = width / spec.aspect;
  const n = cells.length;
  let best: { score: number; rows: Row[]; scale: number } | null = null;

  for (let step = 0; step <= 90; step++) {
    // wall units per unit of natural height
    const scale = 25 * Math.pow(700 / 25, step / 90);
    const cost = new Array<number>(n + 1).fill(Infinity);
    const cut = new Array<number>(n + 1).fill(0);
    cost[0] = 0;

    for (let end = 1; end <= n; end++) {
      let p = 0;
      let q = 0;
      for (let start = end; start >= 1; start--) {
        p += cells[start - 1].p;
        q += cells[start - 1].q;
        const height = (width - q - gap * (end - start)) / p;
        if (height <= 0) break;
        let miss = 0;
        for (let i = start; i <= end; i++) {
          const cell = cells[i - 1];
          const off = Math.log(height / (scale * cell.natural));
          miss += off * off * cell.members.length;
        }
        if (cost[start - 1] + miss < cost[end]) {
          cost[end] = cost[start - 1] + miss;
          cut[end] = start - 1;
        }
      }
    }

    const rows: Row[] = [];
    for (let end = n; end > 0; end = cut[end]) {
      const members = cells.slice(cut[end], end);
      const p = members.reduce((sum, c) => sum + c.p, 0);
      const q = members.reduce((sum, c) => sum + c.q, 0);
      rows.unshift({
        cells: members,
        height: (width - q - gap * (members.length - 1)) / p,
      });
    }
    const total =
      rows.reduce((sum, row) => sum + row.height, 0) + gap * (rows.length - 1);
    const score = cost[n] / n + 4 * Math.log(total / targetHeight) ** 2;
    if (!best || score < best.score) best = { score, rows, scale };
  }
  return best!;
}

/** Widest in the middle, the rest mirrored outwards; stacks hug the centre. */
function mirrored(cells: Cell[], flip: boolean) {
  const widest = (a: Cell, b: Cell) => b.p - a.p;
  const singles = cells.filter((c) => c.members.length === 1).sort(widest);
  const stacks = cells.filter((c) => c.members.length > 1).sort(widest);
  const centre = singles.shift() ?? stacks.shift()!;
  const left: Cell[] = [];
  const right: Cell[] = [];
  [...stacks, ...singles].forEach((cell, i) => {
    if ((i % 2 === 0) !== flip) right.push(cell);
    else left.unshift(cell);
  });
  return [...left, centre, ...right];
}

/**
 * Hang the pieces on one wall. `plan` picks the wall's shape: "wide" for
 * laptops and up, "narrow" for phones.
 */
export function hang(all: Piece[], plan: Plan): Wall {
  const spec = PLANS[plan];
  const { width, gap } = spec;
  const shapes = all.map((piece) => shapeOf(piece, spec));
  const n = shapes.length;
  if (n === 0) return { id: plan, width, height: 0, pieces: [] };

  // The height at which a picture gets the share of wall its size deserves.
  const natural = shapes.map((s) => Math.sqrt(s.weight / s.aspect));
  const tallestFirst = (i: number, j: number) => natural[j] - natural[i];
  let pool = shapes.map((_, i) => i).sort(tallestFirst);

  // The crown: the three tallest upright pictures, if there are enough
  // pictures left over to make a wall beneath them.
  let crown: number[] = [];
  const upright = pool.filter((i) => shapes[i].aspect < 0.8);
  if (n >= 14 && upright.length >= 3) {
    crown = upright.slice(0, 3);
    pool = pool.filter((i) => !crown.includes(i));
  }

  // Stacks: among the smallest third, pair pictures that want about the
  // same width and hang one above the other.
  const cells: Cell[] = [];
  const stacked = new Set<number>();
  const pairs = spec.stackEvery ? Math.round(n / spec.stackEvery) : 0;
  if (pairs > 0) {
    const wants = (i: number) => shapes[i].aspect * natural[i];
    const small = pool
      .slice(-Math.ceil(pool.length / 3))
      .sort((i, j) => wants(i) - wants(j));
    const candidates: { a: number; b: number; apart: number }[] = [];
    for (let k = 0; k + 1 < small.length; k += 2) {
      const [a, b] = [small[k], small[k + 1]];
      candidates.push({ a, b, apart: Math.abs(Math.log(wants(a) / wants(b))) });
    }
    candidates
      .sort((x, y) => x.apart - y.apart)
      .slice(0, pairs)
      .forEach(({ a, b }) => {
        // the wider-looking picture on top
        const [top, bottom] =
          shapes[a].aspect >= shapes[b].aspect ? [a, b] : [b, a];
        const p = 1 / (1 / shapes[top].aspect + 1 / shapes[bottom].aspect);
        cells.push({
          members: [top, bottom],
          p,
          q: -p * gap,
          natural: natural[top] + natural[bottom],
        });
        stacked.add(a).add(b);
      });
  }
  for (const i of pool) {
    if (stacked.has(i)) continue;
    cells.push({
      members: [i],
      p: shapes[i].aspect,
      q: 0,
      natural: natural[i],
    });
  }
  cells.sort((a, b) => b.natural - a.natural);

  const { rows, scale } = registers(cells, spec);

  const boxes = new Map<
    number,
    { x: number; y: number; w: number; h: number }
  >();
  const order: number[] = [];
  let y = 0;

  if (crown.length) {
    // The tallest stands in the middle with the other two, a little
    // shorter and matched in height, either side — and the whole group is
    // kept smaller than the register it stands on, as in the print.
    const [mid, ...sides] = crown;
    const line = [sides[0], mid, sides[1]];
    const centre = Math.min(scale * natural[mid], rows[0].height * 0.86);
    let heights = [centre * 0.86, centre, centre * 0.86];
    const span = () =>
      line.reduce((sum, i, k) => sum + shapes[i].aspect * heights[k], 0) +
      gap * 2;
    if (span() > width * 0.7) {
      const fit = (width * 0.7 - gap * 2) / (span() - gap * 2);
      heights = heights.map((h) => h * fit);
    }
    const tall = Math.max(...heights);
    let x = (width - span()) / 2;
    line.forEach((i, k) => {
      const w = shapes[i].aspect * heights[k];
      boxes.set(i, { x, y: tall - heights[k], w, h: heights[k] });
      order.push(i);
      x += w + gap;
    });
    y = tall + gap;
  }

  rows.forEach((row, r) => {
    let x = 0;
    for (const cell of mirrored(row.cells, r % 2 === 1)) {
      const w = cell.p * row.height + cell.q;
      let top = y;
      for (const i of cell.members) {
        const h = w / shapes[i].aspect;
        boxes.set(i, { x, y: top, w, h });
        order.push(i);
        top += h + gap;
      }
      x += w + gap;
    }
    y += row.height + gap;
  });

  // In hanging order: the crown, then each register left to right.
  const pieces = order.map((i): Hung => {
    const box = boxes.get(i)!;
    const inside = shapes[i].inside(box.w);
    return {
      id: shapes[i].id,
      x: round(box.x),
      y: round(box.y),
      w: round(box.w),
      h: round(box.h),
      pw: round(inside.pw),
      ph: round(inside.ph),
      bw: round(inside.bw),
    };
  });

  return { id: plan, width, height: round(y - gap), pieces };
}
