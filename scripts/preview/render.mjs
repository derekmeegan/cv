#!/usr/bin/env node
// Renders the link preview for the site: the D m mark, whose three figures
// do a wave — each star head hops and spins in turn — and then all jump
// together.
//
//   pnpm preview:render          (needs ffmpeg on the PATH)
//
// Writes, from public/logo.svg:
//
//   public/images/preview/dm.mp4   A short seamless loop. Messages on iOS and
//                                  macOS plays an og:video that points
//                                  straight at an MP4 inside the link bubble,
//                                  muted and on repeat.
//   public/images/preview/dm.png   The mark at rest: the og:image, shown as
//                                  the video's poster and by everything that
//                                  does not play video.
//
// Messages caches a preview by its address, so after changing the animation
// give the files a new name (OUTPUT below, and the paths in app/layout.tsx).

import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const LOGO = path.join(ROOT, "public/logo.svg");
const OUTPUT = path.join(ROOT, "public/images/preview/dm");

const WIDTH = 1200;
const HEIGHT = 630;
const FPS = 30;
const SECONDS = 3.6;
const BACKGROUND = "#ffffff";

// How large the mark is drawn (pixels per unit of the logo's own
// coordinates), and where its middle sits: a little low, to leave headroom
// for the hop.
const SCALE = 6.3;
const MIDDLE = { x: WIDTH / 2, y: HEIGHT / 2 + 34 };

// The wave: when each figure starts, and how its hop is timed (seconds).
const FIRST_HOP = 0.4;
const BETWEEN_HOPS = 0.26;
// Then the three together: a smaller jump, without the spin.
const TOGETHER = 2.2;
const TOGETHER_HOP = 0.55;
const CROUCH = 0.16;
const AIR = 0.62;
const LAND = 0.34;
/** How high a star goes, in logo units (a star is about 19 tall). */
const HOP = 13;

// --- the mark ---------------------------------------------------------------

const logo = await readFile(LOGO, "utf8");
const fill = logo.match(/fill="([^"]+)"/)?.[1] ?? "#111111";
const outline = logo.match(/ d="([^"]+)"/)?.[1];
if (!outline) throw new Error(`No path found in ${LOGO}`);

/** One closed shape of the mark, with the box it sits in. */
function shape(d) {
  const numbers = d.match(/-?\d+\.?\d*/g).map(Number);
  const xs = numbers.filter((_, i) => i % 2 === 0);
  const ys = numbers.filter((_, i) => i % 2 === 1);
  const box = {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
  return {
    d,
    ...box,
    cx: (box.left + box.right) / 2,
    cy: (box.top + box.bottom) / 2,
  };
}

const shapes = outline
  .split(/(?=M)/)
  .map((d) => d.trim())
  .filter(Boolean)
  .map(shape);

// The stars are the shapes in the upper part; each stands on the letterform
// below it. Left to right, they are the three figures.
const split =
  (Math.min(...shapes.map((s) => s.top)) +
    Math.max(...shapes.map((s) => s.bottom))) /
  2;
const byX = (a, b) => a.cx - b.cx;
const stars = shapes.filter((s) => s.bottom < split).sort(byX);
const bodies = shapes.filter((s) => s.bottom >= split).sort(byX);
if (stars.length !== bodies.length || stars.length === 0) {
  throw new Error("Expected one star above each letterform in the logo");
}
const figures = stars.map((star, i) => ({ star, body: bodies[i] }));

const whole = {
  cx:
    (Math.min(...shapes.map((s) => s.left)) +
      Math.max(...shapes.map((s) => s.right))) /
    2,
  cy:
    (Math.min(...shapes.map((s) => s.top)) +
      Math.max(...shapes.map((s) => s.bottom))) /
    2,
};

// --- the motion -------------------------------------------------------------

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mix = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
/** Rises past 1 and settles back: the wobble after a landing. */
const settle = (t) => 1 - Math.exp(-5 * t) * Math.cos(t * Math.PI * 2.5);

/**
 * Where one figure is `t` seconds after a hop begins. `size` scales the whole
 * hop (1 = full height) and `spin` is how far the star turns in the air.
 * Returns the star's lift (logo units, up is negative), turn (degrees) and
 * stretch, and the body's stretch.
 */
function hop(t, size = 1, spin = 360) {
  if (t <= 0 || t >= CROUCH + AIR + LAND) return null;
  const full = hopAt(t, spin);
  const soften = ([x, y]) => [mix(1, x, size), mix(1, y, size)];
  return {
    lift: full.lift * size,
    turn: full.turn,
    star: soften(full.star),
    body: soften(full.body),
  };
}

function hopAt(t, spin) {
  const lean = spin ? -10 : 0;

  if (t < CROUCH) {
    // gather: the body sinks and the head rides down on it
    const k = easeInOut(t / CROUCH);
    return {
      lift: 0,
      turn: mix(0, lean, k),
      star: [mix(1, 1.05, k), mix(1, 0.94, k)],
      body: [mix(1, 1.035, k), mix(1, 0.925, k)],
    };
  }

  if (t < CROUCH + AIR) {
    // up and over: a full turn in the air, so it lands as it left
    const u = (t - CROUCH) / AIR;
    const spring = clamp01(u / 0.28);
    return {
      lift: -HOP * 4 * u * (1 - u),
      turn: mix(lean, spin, easeInOut(u)),
      star: [mix(1.05, 1, easeOut(spring)), mix(0.94, 1, easeOut(spring))],
      // the body springs up past its height, then comes back to it
      body: [
        mix(1.035, 1, easeOut(spring)) - 0.02 * Math.sin(Math.PI * spring),
        mix(0.925, 1, easeOut(spring)) + 0.05 * Math.sin(Math.PI * spring),
      ],
    };
  }

  // touch down: both give a little, and settle
  const k = settle((t - CROUCH - AIR) / LAND);
  return {
    lift: 0,
    turn: 0,
    star: [mix(1.13, 1, k), mix(0.84, 1, k)],
    body: [mix(1.025, 1, k), mix(0.955, 1, k)],
  };
}

const n = (v) => Number(v.toFixed(3));

function frame(time) {
  const paths = figures.map(({ star, body }, i) => {
    const p = hop(time - FIRST_HOP - i * BETWEEN_HOPS) ??
      hop(time - TOGETHER, TOGETHER_HOP, 0) ?? {
        lift: 0,
        turn: 0,
        star: [1, 1],
        body: [1, 1],
      };
    // The body stretches from its feet; the head stays on its shoulders,
    // so it moves by however much the body's top has.
    const shoulders = (body.bottom - body.top) * (1 - p.body[1]);
    const bodyAt = `translate(${n(body.cx)} ${n(body.bottom)}) scale(${n(p.body[0])} ${n(p.body[1])}) translate(${n(-body.cx)} ${n(-body.bottom)})`;
    const starAt = [
      `translate(0 ${n(p.lift + shoulders)})`,
      // squashes against whatever it is standing on
      `translate(${n(star.cx)} ${n(star.bottom)}) scale(${n(p.star[0])} ${n(p.star[1])}) translate(${n(-star.cx)} ${n(-star.bottom)})`,
      `rotate(${n(p.turn)} ${n(star.cx)} ${n(star.cy)})`,
    ].join(" ");
    return `<path transform="${bodyAt}" d="${body.d}"/><path transform="${starAt}" d="${star.d}"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="100%" height="100%" fill="${BACKGROUND}"/>
  <g fill="${fill}" transform="translate(${MIDDLE.x} ${MIDDLE.y}) scale(${SCALE}) translate(${n(-whole.cx)} ${n(-whole.cy)})">${paths.join("")}</g>
</svg>`;
}

// --- render -----------------------------------------------------------------

const frames = Math.round(SECONDS * FPS);
const work = await mkdtemp(path.join(tmpdir(), "dm-preview-"));
try {
  for (let f = 0; f < frames; f++) {
    await sharp(Buffer.from(frame(f / FPS)))
      .png({ compressionLevel: 1 })
      .toFile(path.join(work, `${String(f).padStart(4, "0")}.png`));
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await sharp(Buffer.from(frame(0)))
    .png({ compressionLevel: 9, palette: true })
    .toFile(`${OUTPUT}.png`);

  // Optional: a strip of frames to look over (not part of the site).
  if (process.env.PREVIEW_SHEET) {
    const picks = Array.from({ length: 12 }, (_, i) =>
      Math.round((i * frames) / 12),
    );
    const tiles = await Promise.all(
      picks.map((f) =>
        sharp(Buffer.from(frame(f / FPS)))
          .resize(600)
          .png()
          .toBuffer(),
      ),
    );
    await sharp({
      create: { width: 2400, height: 945, channels: 3, background: "#888" },
    })
      .composite(
        tiles.map((input, i) => ({
          input,
          left: (i % 4) * 600,
          top: Math.floor(i / 4) * 315,
        })),
      )
      .png()
      .toFile(process.env.PREVIEW_SHEET);
  }

  // H.264 in an MP4, the one form Messages plays; no sound track; the index
  // at the front so it can start before it has all arrived.
  const encode = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      String(FPS),
      "-i",
      path.join(work, "%04d.png"),
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryslow",
      "-crf",
      "17",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-movflags",
      "+faststart",
      `${OUTPUT}.mp4`,
    ],
    { stdio: "inherit" },
  );
  if (encode.error?.code === "ENOENT") {
    throw new Error("ffmpeg was not found; install it and run this again");
  }
  if (encode.status !== 0) throw new Error("ffmpeg could not encode the video");

  const size = (await readFile(`${OUTPUT}.mp4`)).length;
  console.log(
    `${path.relative(ROOT, OUTPUT)}.mp4  ${frames} frames, ${SECONDS}s, ${(size / 1024).toFixed(0)} KB`,
  );
  console.log(`${path.relative(ROOT, OUTPUT)}.png  ${WIDTH}×${HEIGHT}`);
} finally {
  await rm(work, { recursive: true, force: true });
}
