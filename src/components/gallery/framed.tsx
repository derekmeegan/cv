import Image from "next/image";

import { FRAMES } from "@/lib/gallery-layout";
import { cn } from "@/lib/utils";
import type { FrameStyle, Piece } from "@/types/gallery";

/** `sizes` for the sharper image shown once you have stepped up to a piece. */
const CLOSE_UP_SIZES = "(max-width: 899px) 95vw, 62vw";

function reveal(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = "true";
}

/* --- hanging a piece once it has arrived ----------------------------------
   A piece is not shown while its picture is still on its way: it would be an
   empty frame, and then a picture appearing in it. It stays out of sight
   until the picture and the textures of its frame are all in hand, and then
   it fades up (see .gal-piece in gallery.css). Pieces that are ready at the
   same moment come up one after another, so a wall that arrives all at once
   fills in as a ripple rather than a flash.

   This is written straight onto the elements, not through React state: it
   happens thirty-odd times while the page is loading. */

/** The textures a moulding is drawn from (see .gal-frame--* in gallery.css). */
function frameTextures(style: FrameStyle) {
  const base = `/images/gallery/frames/${style}`;
  return FRAMES[style].centres
    ? [
        `${base}.webp`,
        ...["top", "bottom", "left", "right"].map(
          (side) => `${base}-${side}.webp`,
        ),
      ]
    : [`${base}.webp`];
}

const textures = new Map<string, Promise<void>>();

/** Resolves once a texture has loaded, or has failed to. */
function texture(src: string) {
  let loaded = textures.get(src);
  if (!loaded) {
    loaded = new Promise<void>((resolve) => {
      const image = new window.Image();
      image.onload = image.onerror = () => resolve();
      image.src = src;
    });
    textures.set(src, loaded);
  }
  return loaded;
}

const arriving = new WeakSet<HTMLElement>();
const ready: HTMLElement[] = [];
let hanging = false;

/** Shows the pieces that are ready, a moment apart. */
function hangNext() {
  const piece = ready.shift();
  if (!piece) {
    hanging = false;
    return;
  }
  piece.setAttribute("data-hung", "");
  // No pause after a piece nobody can see: one in the hanging plan that is
  // not being shown (two are rendered; see gallery.tsx), or any at all in a
  // tab that is in the background, where timers are slowed to a crawl.
  if (document.hidden || piece.offsetParent === null) hangNext();
  else window.setTimeout(hangNext, 22);
}

function arrive(picture: HTMLImageElement, frame: FrameStyle | null) {
  const piece = picture.closest<HTMLElement>("[data-piece]");
  if (!piece || arriving.has(piece)) return;
  arriving.add(piece);
  const frameReady = frame
    ? Promise.all(frameTextures(frame).map(texture))
    : Promise.resolve();
  // a frame that is slow to come does not keep its picture waiting for long
  const patience = new Promise((resolve) => window.setTimeout(resolve, 1500));
  void Promise.race([frameReady, patience]).then(() => {
    ready.push(piece);
    if (!hanging) {
      hanging = true;
      hangNext();
    }
  });
}

/**
 * A picture in its frame, filling its parent. The parent supplies `--w` (the
 * outer width in wall units) and `--u` (pixels per unit).
 *
 * Two kinds of frame:
 *  - a museum photograph of the work in its real frame (background removed),
 *    shown as-is;
 *  - otherwise a rendered period moulding, applied as a 9-slice border image
 *    so it fits any proportion.
 *
 * With `closeUp`, a sharper image is loaded and laid over the first once it
 * has arrived — the picture on the wall is never taken away, so nothing
 * flickers.
 *
 * The parent piece (the element with `data-piece`) is marked `data-hung`
 * when the picture and its frame have arrived: see `arrive` above.
 */
export function Framed({
  piece,
  bw,
  pw,
  ph,
  sizes,
  closeUp,
}: {
  piece: Piece;
  /** Frame width and picture size, in wall units. */
  bw: number;
  pw: number;
  ph: number;
  /** `sizes` for the image at wall scale. */
  sizes: string;
  closeUp?: boolean;
}) {
  const alt = `${piece.title}, ${piece.artist}`;
  const source = piece.framed ?? piece.image;
  const frame = piece.framed ? null : piece.frame;
  // (a picture that cannot be had still gets its frame hung)
  const arrived = (event: React.SyntheticEvent<HTMLImageElement>) =>
    arrive(event.currentTarget, frame);

  const pictures = (
    <>
      <Image
        src={source.src}
        alt={alt}
        width={source.width}
        height={source.height}
        sizes={sizes}
        draggable={false}
        onLoad={arrived}
        onError={arrived}
      />
      {closeUp ? (
        <Image
          src={source.src}
          alt=""
          aria-hidden="true"
          width={source.width}
          height={source.height}
          sizes={CLOSE_UP_SIZES}
          loading="eager"
          className="gal-sharp"
          draggable={false}
          onLoad={reveal}
        />
      ) : null}
    </>
  );

  if (piece.framed) {
    return <span className="gal-framed gal-framed--real">{pictures}</span>;
  }

  const spec = FRAMES[piece.frame];
  // Centre ornaments only where a side is long enough to carry one between
  // the corner pieces.
  const room = spec.centreLength * 0.86 + 0.5;
  const centreX = spec.centres && pw > bw * room;
  const centreY = spec.centres && ph > bw * room;

  return (
    <span
      className={cn("gal-framed", `gal-frame--${piece.frame}`)}
      style={
        {
          "--frame-w": bw,
          "--tone": piece.image.color ?? "#3a3128",
        } as React.CSSProperties
      }
    >
      <span className="gal-picture">{pictures}</span>
      <span className="gal-moulding" aria-hidden="true" />
      {centreX ? (
        <>
          <span className="gal-centre gal-centre--top" aria-hidden="true" />
          <span className="gal-centre gal-centre--bottom" aria-hidden="true" />
        </>
      ) : null}
      {centreY ? (
        <>
          <span className="gal-centre gal-centre--left" aria-hidden="true" />
          <span className="gal-centre gal-centre--right" aria-hidden="true" />
        </>
      ) : null}
    </span>
  );
}
