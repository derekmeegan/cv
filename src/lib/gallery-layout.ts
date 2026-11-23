import frames from "@/data/gallery/frames.json";
import type { FrameSpec, FrameStyle, Piece } from "@/types/gallery";

/**
 * Hanging plan for the gallery: one wall, covered. The inspiration is the
 * Paris Salon as Martini engraved it in 1787 — frame against frame from dado
 * to cornice — but fitted together like a collage rather than ruled into
 * rows, with pieces of wrought iron in among the pictures the way Albert
 * Barnes hung them.
 *
 * Every picture keeps its own proportions. The wall is a "slicing" layout: a
 * binary tree whose leaves are pictures (and the odd piece of ironwork) and
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

export type Plan = "wide" | "narrow";

interface PlanSpec {
  width: number;
  /** Intended wall shape, width ÷ height. */
  aspect: number;
  /** Space between the mouldings of neighbouring frames. */
  gap: number;
  /**
   * How strongly real size shows: the exponent on a work's side length, and
   * the smallest and largest it may count as (1 = an 80 cm picture).
   */
  contrast: number;
  smallest: number;
  largest: number;
  /** One piece of ironwork for every this many pictures. */
  ironEvery: number;
}

const PLANS: Record<Plan, PlanSpec> = {
  // about the shape of a laptop screen, so the whole wall is in view
  wide: {
    width: 1500,
    aspect: 1.95,
    gap: 5,
    contrast: 0.62,
    smallest: 0.6,
    largest: 2.7,
    ironEvery: 6,
  },
  // a tall strip for phones, a screen and a bit long; sizes kept closer
  // together so nothing gets too small to tap
  narrow: {
    width: 620,
    aspect: 0.43,
    gap: 4,
    contrast: 0.42,
    smallest: 0.74,
    largest: 1.9,
    ironEvery: 9,
  },
};

/** The ironwork, in hanging order, with the shape of the place each needs. */
const IRONWORK: { kind: IronKind; aspect: number }[] = [
  { kind: "cock", aspect: 0.86 },
  { kind: "scroll", aspect: 1.75 },
  { kind: "strap", aspect: 0.42 },
  { kind: "key", aspect: 0.46 },
  { kind: "fleur", aspect: 0.6 },
  { kind: "latch", aspect: 1.65 },
  { kind: "ring", aspect: 0.92 },
  { kind: "tongs", aspect: 0.45 },
];

/** A piece of ironwork gets this much wall, as a share of an average picture. */
const IRON_SHARE = 0.26;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const round = (v: number) => Math.round(v * 100) / 100;

/** What the packer needs to know about one framed picture. */
interface Shape {
  id: string;
  /**
   * Proportions of the moulding itself, width ÷ height. The frame textures
   * carry a transparent margin for ornament that stands proud of the rail;
   * frames are packed moulding to moulding and that ornament overlaps the
   * neighbours a little, as carved corners do on a crowded wall.
   */
  aspect: number;
  /** How much wall it should get, relative to the others. */
  weight: number;
  /**
   * For a moulding `w` wide: how far the texture reaches beyond it, the
   * picture's size, and the frame's (texture) width.
   */
  inside(w: number): { bleed: number; pw: number; ph: number; bw: number };
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
        return { bleed: 0, pw, ph: pw / ratio, bw: (w - pw) / 2 };
      },
    };
  }

  const moulding = FRAMES[piece.frame];
  const visible = 1 - moulding.margin / moulding.slice;
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
    frame = clamp(real / visible, moulding.width * 0.7, moulding.width * 1.35);
  }
  // In units of the picture's mean side: the picture is √ratio by 1/√ratio,
  // and the moulding adds `frame × visible` on every side.
  const rail = frame * visible;
  const across = Math.sqrt(ratio) + 2 * rail;
  const down = 1 / Math.sqrt(ratio) + 2 * rail;
  return {
    id: piece.id,
    aspect: across / down,
    weight: mean * across * (mean * down),
    inside(w) {
      const unit = w / across;
      return {
        bleed: unit * (frame - rail),
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
  if (n === 0) return { id: plan, width, height: 0, pieces: [], ironwork: [] };

  // Ironwork takes its place in the packing like a small picture would.
  const average = shapes.reduce((sum, s) => sum + s.weight, 0) / n;
  const irons = Array.from(
    { length: Math.round(n / spec.ironEvery) },
    (_, i) => IRONWORK[i % IRONWORK.length],
  );
  const aspects = [
    ...shapes.map((s) => s.aspect),
    ...irons.map((i) => i.aspect),
  ];
  const weights = [
    ...shapes.map((s) => s.weight),
    ...irons.map(() => average * IRON_SHARE),
  ];
  const count = aspects.length;

  const total = weights.reduce((sum, w) => sum + w, 0);
  const targets = weights.map((w) => w / total);
  const largest = targets.indexOf(Math.max(...targets));
  const targetHeight = width / aspect;
  const boxes = new Float64Array(count * 4);

  const score = (expr: number[]) => {
    const root = parse(expr, aspects, gap);
    const height = (width - root.q) / root.p;
    if (!(height > 0)) return Infinity;
    place(root, 0, 0, width, height, gap, boxes);

    let covered = 0;
    for (let i = 0; i < count; i++) {
      const w = boxes[i * 4 + 2];
      const h = boxes[i * 4 + 3];
      if (!(w > 6 && h > 6)) return Infinity;
      covered += w * h;
    }
    // each picture's share of the wall against the share it deserves; the
    // ironwork is less particular about its size than the pictures are
    let fit = 0;
    for (let i = 0; i < count; i++) {
      const share = (boxes[i * 4 + 2] * boxes[i * 4 + 3]) / covered;
      const off = Math.log(share / targets[i]);
      fit += off * off * (i < n ? 1 : 0.4);
    }
    // Ironwork is scattered: in among the pictures rather than out on the
    // edge of the wall, and no two pieces of it close together.
    let stray = 0;
    const apart = 0.3 * Math.sqrt(width * height);
    for (let i = n; i < count; i++) {
      const x = boxes[i * 4];
      const y = boxes[i * 4 + 1];
      const w = boxes[i * 4 + 2];
      const h = boxes[i * 4 + 3];
      if (x < 1 || y < 1 || x + w > width - 1 || y + h > height - 1) {
        stray += 1;
      }
      for (let j = i + 1; j < count; j++) {
        const dx = x + w / 2 - (boxes[j * 4] + boxes[j * 4 + 2] / 2);
        const dy = y + h / 2 - (boxes[j * 4 + 1] + boxes[j * 4 + 3] / 2);
        const near = 1 - Math.hypot(dx, dy) / apart;
        if (near > 0) stray += 4 * near * near;
      }
    }
    // the wall should come out roughly the intended shape...
    const shape = Math.log(height / targetHeight) ** 2;
    // ...with the grandest picture near the middle of it.
    const cx = (boxes[largest * 4] + boxes[largest * 4 + 2] / 2) / width - 0.5;
    const cy =
      (boxes[largest * 4 + 1] + boxes[largest * 4 + 3] / 2) / height - 0.5;
    return fit / count + 5 * shape + 0.5 * (cx * cx + cy * cy) + 0.02 * stray;
  };

  const random = mulberry32(hash(`${plan}:${shapes.map((s) => s.id).join()}`));
  const pick = (limit: number) => Math.floor(random() * limit);

  let best = seedExpr(
    aspects.map((_, i) => i),
    targets,
    aspect,
  );
  let bestScore = score(best);

  if (count > 1) {
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
    const { bleed, pw, ph, bw } = shape.inside(w);
    return {
      id: shape.id,
      x: round(boxes[i * 4] - bleed),
      y: round(boxes[i * 4 + 1] - bleed),
      w: round(w + 2 * bleed),
      h: round(boxes[i * 4 + 3] + 2 * bleed),
      pw: round(pw),
      ph: round(ph),
      bw: round(bw),
    };
  });

  // Reading order for stepping through: across the wall, left to right.
  pieces.sort((a, b) => a.x + a.w / 2 - (b.x + b.w / 2) || a.y - b.y);

  const ironwork = irons.map((iron, k): Iron => {
    const i = n + k;
    const x = boxes[i * 4];
    const w = boxes[i * 4 + 2];
    return {
      kind: iron.kind,
      x: round(x),
      y: round(boxes[i * 4 + 1]),
      w: round(w),
      h: round(boxes[i * 4 + 3]),
      // hooks and scrolls turn toward the middle of the wall
      flip: x + w / 2 > width / 2,
    };
  });

  return { id: plan, width, height: round(height), pieces, ironwork };
}
