import type { Metadata } from "next";

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

export default function GalleryPage() {
  return (
    <main className="gal-page">
      <header className="gal-header">
        <SiteNav />
        <h1>Gallery</h1>
        <p>
          Pictures I keep going back to, from the Barnes, the Philadelphia
          Museum of Art, the Met, the Getty, the de Young and the Legion of
          Honor — hung frame to frame, floor to ceiling, the way the Paris Salon
          covered its walls. Pick one to look closer.
        </p>
      </header>

      <Gallery pieces={pieces} plans={plans} />

      <footer className="gal-footer">
        <p>
          Every work here is in the public domain; images come from the museums’
          open-access collections and each piece links back to its own page.
          Frames are period mouldings rendered for this page, except where a
          museum publishes a photograph of the real one.
        </p>
      </footer>
    </main>
  );
}
