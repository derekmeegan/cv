import frames from "@/data/gallery/frames.json";
import type { FrameSpec, FrameStyle, Piece } from "@/types/gallery";

/**
 * Hanging plan for the gallery: a Salon hang. Every picture keeps its own
 * proportions, frames sit a hand's width apart, and together they cover the
 * wall edge to edge.
 *
 * The wall is a "slicing" layout: a binary tree whose leaves are pictures and
 * whose branches put two groups either side by side (equal heights) or one
 * above the other (equal widths). For any such tree there is exactly one set
 * of sizes that fills a wall of a given width with a fixed gap, so the work
 * is choosing the tree. That is done by simulated annealing over the tree's
 * postfix form — the classic floorplanning method — scoring how closely each
 * picture's share of the wall matches the share its real size deserves.
 *
 * Everything is in abstract wall units; CSS scales the wall to its container.
 * The plan is computed once, on the server.
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
  /** Intended wall shape, width ÷ height. */
  aspect: number;
  gap: number;
  /**
   * How strongly real size shows: the exponent on a work's side length, and
   * the smallest and largest it may count as (1 = an 80 cm picture).
   */
  contrast: number;
  smallest: number;
  largest: number;
}

const PLANS: Record<Plan, PlanSpec> = {
  // a broad wall, a little taller than a laptop screen
  wide: {
    width: 1500,
    aspect: 1.34,
    gap: 12,
    contrast: 0.62,
    smallest: 0.58,
    largest: 2.7,
  },
  // a tall strip for phones, where nothing can afford to get tiny
  narrow: {
    width: 620,
    aspect: 0.37,
    gap: 8,
    contrast: 0.4,
    smallest: 0.74,
    largest: 1.9,
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

// --- slicing tree -----------------------------------------------------------

/** Postfix tokens: a picture's index, or one of these two operators. */
const BESIDE = -1;
const ABOVE = -2;

/**
 * A subtree's width is always `p × height + q` — pictures contribute their
 * proportions to p, gaps accumulate in q.
 */
interface Node {
  p: number;
  q: number;
  leaf: number;
  op: number;
  a: Node | null;
  b: Node | null;
}

function parse(expr: number[], aspects: number[], gap: number): Node {
  const stack: Node[] = [];
  for (const token of expr) {
    if (token >= 0) {
      stack.push({
        p: aspects[token],
        q: 0,
        leaf: token,
        op: 0,
        a: null,
        b: null,
      });
      continue;
    }
    const b = stack.pop()!;
    const a = stack.pop()!;
    if (token === BESIDE) {
      stack.push({
        p: a.p + b.p,
        q: a.q + b.q + gap,
        leaf: -1,
        op: BESIDE,
        a,
        b,
      });
    } else {
      const p = 1 / (1 / a.p + 1 / b.p);
      const q = p * (a.q / a.p + b.q / b.p - gap);
      stack.push({ p, q, leaf: -1, op: ABOVE, a, b });
    }
  }
  return stack[0];
}

/** Writes each leaf's x, y, w, h into `boxes` (4 numbers per picture). */
function place(
  node: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number,
  boxes: Float64Array,
) {
  if (node.leaf >= 0) {
    boxes.set([x, y, w, h], node.leaf * 4);
    return;
  }
  const a = node.a!;
  const b = node.b!;
  if (node.op === BESIDE) {
    const wa = a.p * h + a.q;
    place(a, x, y, wa, h, gap, boxes);
    place(b, x + wa + gap, y, w - wa - gap, h, gap, boxes);
  } else {
    const ha = (w - a.q) / a.p;
    place(a, x, y, w, ha, gap, boxes);
    place(b, x, y + ha + gap, w, h - ha - gap, gap, boxes);
  }
}

/** A balanced first guess: halve the pictures by weight, again and again. */
function seedExpr(
  items: number[],
  weights: number[],
  aspect: number,
): number[] {
  if (items.length === 1) return items;
  const left: number[] = [];
  const right: number[] = [];
  let lw = 0;
  let rw = 0;
  for (const item of [...items].sort((i, j) => weights[j] - weights[i])) {
    if (lw <= rw) {
      left.push(item);
      lw += weights[item];
    } else {
      right.push(item);
      rw += weights[item];
    }
  }
  const share = lw / (lw + rw);
  const beside = aspect > 1;
  return [
    ...seedExpr(left, weights, beside ? aspect * share : aspect / share),
    ...seedExpr(
      right,
      weights,
      beside ? aspect * (1 - share) : aspect / (1 - share),
    ),
    beside ? BESIDE : ABOVE,
  ];
}

/** Small seeded generator, so the same list always hangs the same way. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** A valid postfix expression has more operands than operators in every prefix. */
function wellFormed(expr: number[]) {
  let depth = 0;
  for (const token of expr) {
    depth += token >= 0 ? 1 : -1;
    if (depth < 1) return false;
  }
  return depth === 1;
}

/**
 * Hang the pieces on one wall. `plan` picks the wall's shape: "wide" for
 * laptops and up, "narrow" for phones.
 */
export function hang(all: Piece[], plan: Plan): Wall {
  const spec = PLANS[plan];
  const { width, aspect, gap } = spec;
  const shapes = all.map((piece) => shapeOf(piece, spec));
  const n = shapes.length;
  if (n === 0) return { id: plan, width, height: 0, pieces: [] };

  const aspects = shapes.map((s) => s.aspect);
  const total = shapes.reduce((sum, s) => sum + s.weight, 0);
  const targets = shapes.map((s) => s.weight / total);
  const largest = targets.indexOf(Math.max(...targets));
  const targetHeight = width / aspect;
  const boxes = new Float64Array(n * 4);

  const score = (expr: number[]) => {
    const root = parse(expr, aspects, gap);
    const height = (width - root.q) / root.p;
    if (!(height > 0)) return Infinity;
    place(root, 0, 0, width, height, gap, boxes);

    let covered = 0;
    for (let i = 0; i < n; i++) {
      const w = boxes[i * 4 + 2];
      const h = boxes[i * 4 + 3];
      if (!(w > 6 && h > 6)) return Infinity;
      covered += w * h;
    }
    // each picture's share of the wall against the share it deserves
    let fit = 0;
    for (let i = 0; i < n; i++) {
      const share = (boxes[i * 4 + 2] * boxes[i * 4 + 3]) / covered;
      const off = Math.log(share / targets[i]);
      fit += off * off;
    }
    // the wall should come out roughly the intended shape...
    const shape = Math.log(height / targetHeight) ** 2;
    // ...with the grandest picture near the middle of it.
    const cx = (boxes[largest * 4] + boxes[largest * 4 + 2] / 2) / width - 0.5;
    const cy =
      (boxes[largest * 4 + 1] + boxes[largest * 4 + 3] / 2) / height - 0.5;
    return fit / n + 5 * shape + 0.5 * (cx * cx + cy * cy);
  };

  const random = mulberry32(hash(`${plan}:${shapes.map((s) => s.id).join()}`));
  const pick = (count: number) => Math.floor(random() * count);

  let best = seedExpr(
    shapes.map((_, i) => i),
    targets,
    aspect,
  );
  let bestScore = score(best);

  if (n > 1) {
    for (let run = 0; run < 3; run++) {
      let current = [...best];
      let currentScore = bestScore;
      const steps = 14000;
      for (let step = 0; step < steps; step++) {
        const heat = 0.25 * Math.pow(0.004, step / steps);
        const next = [...current];
        const move = random();
        if (move < 0.5) {
          // swap two pictures
          let i = pick(next.length);
          while (next[i] < 0) i = pick(next.length);
          let j = pick(next.length);
          while (next[j] < 0 || j === i) j = pick(next.length);
          [next[i], next[j]] = [next[j], next[i]];
        } else if (move < 0.8) {
          // turn a side-by-side pair into a stacked one, or back
          let i = pick(next.length);
          while (next[i] >= 0) i = pick(next.length);
          next[i] = next[i] === BESIDE ? ABOVE : BESIDE;
        } else {
          // regroup: slide an operator past a neighbouring picture
          const i = pick(next.length - 1);
          if (next[i] >= 0 === next[i + 1] >= 0) continue;
          [next[i], next[i + 1]] = [next[i + 1], next[i]];
          if (!wellFormed(next)) continue;
        }
        const nextScore = score(next);
        if (
          nextScore < currentScore ||
          random() < Math.exp((currentScore - nextScore) / heat)
        ) {
          current = next;
          currentScore = nextScore;
          if (currentScore < bestScore) {
            best = [...current];
            bestScore = currentScore;
          }
        }
      }
    }
  }

  const root = parse(best, aspects, gap);
  const height = (width - root.q) / root.p;
  place(root, 0, 0, width, height, gap, boxes);

  const pieces = shapes.map((shape, i): Hung => {
    const w = boxes[i * 4 + 2];
    const inside = shape.inside(w);
    return {
      id: shape.id,
      x: round(boxes[i * 4]),
      y: round(boxes[i * 4 + 1]),
      w: round(w),
      h: round(boxes[i * 4 + 3]),
      pw: round(inside.pw),
      ph: round(inside.ph),
      bw: round(inside.bw),
    };
  });

  // Reading order for stepping through: in columns, left to right.
  pieces.sort((a, b) => a.x + a.w / 2 - (b.x + b.w / 2) || a.y - b.y);

  return { id: plan, width, height: round(height), pieces };
}
