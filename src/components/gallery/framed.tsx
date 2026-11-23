import Image from "next/image";

import { FRAMES } from "@/lib/gallery-layout";
import { cn } from "@/lib/utils";
import type { Piece } from "@/types/gallery";

/** `sizes` for the sharper image shown once you have stepped up to a piece. */
const CLOSE_UP_SIZES = "(max-width: 899px) 95vw, 62vw";

function reveal(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = "true";
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

  const pictures = (
    <>
      <Image
        src={source.src}
        alt={alt}
        width={source.width}
        height={source.height}
        sizes={sizes}
        draggable={false}
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
