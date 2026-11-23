import type { Metadata } from "next";
import { preload } from "react-dom";

import { Gallery } from "@/components/gallery/gallery";
import { SiteNav } from "@/components/site-nav";
import { PROFILE } from "@/constants/profile";
import data from "@/data/gallery/pieces.json";
import { hang } from "@/lib/gallery-layout";
import type { Piece } from "@/types/gallery";

import "./gallery.css";

export const metadata: Metadata = {
  title: `Gallery | ${PROFILE.name}`,
  description:
    "Pictures I keep going back to, hung frame to frame the way the Paris Salon covered its walls.",
};

// The museum's own text is only shown for pieces without a note of mine, so
// there is no need to send it to the browser otherwise.
const pieces = (data as unknown as Piece[]).map((piece) => ({
  ...piece,
  description: piece.about ? null : piece.description,
}));

// Two hanging plans: a broad wall for wide screens, a tall one for phones.
// CSS shows whichever fits.
const plans = { wide: hang(pieces, "wide"), narrow: hang(pieces, "narrow") };

// The mouldings in use. Each piece waits for its frame as well as its picture
// before it is shown, so the frames are asked for at once, not when the
// stylesheet gets round to them.
const mouldings = [
  ...new Set(
    pieces.filter((piece) => !piece.framed).map((piece) => piece.frame),
  ),
];

export default function GalleryPage() {
  for (const moulding of mouldings) {
    preload(`/images/gallery/frames/${moulding}.webp`, { as: "image" });
  }

  return (
    <main className="gal-page">
      {/* Pieces are hidden until their pictures arrive, which takes a
          script: without one, they are simply there. */}
      <noscript>
        <style>{".gal-piece { opacity: 1; }"}</style>
      </noscript>
      {/* Same box as the other pages' layout, so the nav does not move. */}
      <div className="gal-nav container mx-auto flex-none p-4 pb-0 md:p-16 md:pb-0">
        <div className="mx-auto w-full max-w-2xl">
          <SiteNav />
        </div>
      </div>
      <h1 className="gal-sr-only">Gallery</h1>
      <Gallery pieces={pieces} plans={plans} />
    </main>
  );
}
