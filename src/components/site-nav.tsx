import Link from "next/link";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "About" },
  { href: "/students", label: "Students" },
  { href: "/writing", label: "Writing" },
  { href: "/gallery", label: "Gallery" },
];

export function SiteNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex flex-row flex-wrap gap-x-10 gap-y-2 font-mono text-sm text-muted-foreground",
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
