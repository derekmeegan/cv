import Image from "next/image";

import { FRAMES } from "@/lib/gallery-layout";
import { cn } from "@/lib/utils";
import type { Piece } from "@/types/gallery";

/**
 * A picture in its frame. Sizes come from the parent as CSS custom
 * properties in wall units (`--pw`, `--ph`, `--bw`) and a `--u` scale, so the
 * same markup serves the wall and the close-up.
 *
 * Two kinds of frame:
 *  - a museum photograph of the work in its real frame (background removed),
 *    shown as-is;
 *  - otherwise a rendered period moulding, applied as a 9-slice border image
 *    so it fits any proportion.
 */
export function Framed({
  piece,
  bw,
  pw,
  ph,
  sizes,
  priority,
  detailSizes,
}: {
  piece: Piece;
  /** Frame width and picture size, in wall units. */
  bw: number;
  pw: number;
  ph: number;
  /** `sizes` for the image at wall scale. */
  sizes: string;
  priority?: boolean;
  /** When set, a sharper image is layered on top for the close-up. */
  detailSizes?: string;
}) {
  const alt = `${piece.title}, ${piece.artist}`;

  if (piece.framed) {
    const { framed } = piece;
    return (
      <span className="gal-framed gal-framed--real">
        <Image
          src={framed.src}
          alt={alt}
          width={framed.width}
          height={framed.height}
          sizes={sizes}
          priority={priority}
          draggable={false}
        />
        {detailSizes ? (
          <Image
            src={framed.src}
            alt=""
            aria-hidden="true"
            width={framed.width}
            height={framed.height}
            sizes={detailSizes}
            className="gal-detail"
            draggable={false}
          />
        ) : null}
      </span>
    );
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
      <span className="gal-picture">
        <Image
          src={piece.image.src}
          alt={alt}
          width={piece.image.width}
          height={piece.image.height}
          sizes={sizes}
          priority={priority}
          draggable={false}
        />
        {detailSizes ? (
          <Image
            src={piece.image.src}
            alt=""
            aria-hidden="true"
            width={piece.image.width}
            height={piece.image.height}
            sizes={detailSizes}
            className="gal-detail"
            draggable={false}
          />
        ) : null}
      </span>
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
