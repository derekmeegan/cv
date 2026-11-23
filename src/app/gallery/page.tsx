import type { Metadata } from "next";

import { Gallery } from "@/components/gallery/gallery";
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

export default function GalleryPage() {
  return (
    <main className="gal-page">
      <h1 className="gal-sr-only">Gallery</h1>
      <Gallery pieces={pieces} plans={plans} />
    </main>
  );
}
