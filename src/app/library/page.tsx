import type { Metadata } from "next";

import { Library } from "@/components/library/library";
import { SiteNav } from "@/components/site-nav";
import { PROFILE } from "@/constants/profile";

import "./library.css";

export const metadata: Metadata = {
  title: `Library | ${PROFILE.name}`,
  description:
    "Books on my shelves, bound alike in cloth. Take one down and turn it over.",
};

export default function LibraryPage() {
  return (
    <main className="lib-page">
      {/* Same box as the other pages' layout, so the nav does not move. */}
      <div className="lib-nav container mx-auto p-4 pb-0 md:p-16 md:pb-0">
        <div className="mx-auto w-full max-w-2xl">
          <SiteNav />
        </div>
      </div>
      <Library />
    </main>
  );
}
