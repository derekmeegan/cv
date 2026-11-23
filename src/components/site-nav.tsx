import Link from "next/link";

import { cn } from "@/lib/utils";

// Students is hidden for now: its page lives in app/(site)/_students, and the
// underscore keeps Next from serving it. To bring it back, rename that folder
// to "students" and add { href: "/students", label: "Students" } here.
const LINKS = [
  { href: "/", label: "About" },
  { href: "/writing", label: "Writing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/library", label: "Library" },
];

export function SiteNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex flex-row flex-wrap gap-x-10 gap-y-2 font-sans text-sm text-muted-foreground",
        className,
      )}
    >
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
