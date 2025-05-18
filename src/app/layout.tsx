import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter } from "next/font/google";
import { RESUME_DATA } from "@/data/resume-data";
import { CommandMenu } from "@/components/command-menu";
import Link from "next/link";

import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: `${RESUME_DATA.name} | ${RESUME_DATA.about}`,
  description: RESUME_DATA.summary,
};
// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <main className="container relative mx-auto scroll-my-12 overflow-auto p-4 print:p-12 md:p-16">
          <section className="mx-auto w-full max-w-2xl space-y-8 bg-white print:space-y-6">
            <div className="flex flex-row gap-10 font-mono text-sm text-muted-foreground">
              <Link href="/">Resume</Link>
              <Link href="/students">Students</Link>
              <Link href="/writing">Writing</Link>
            </div>
            {children}
          </section>
        </main>
        <CommandMenu
          links={[
            {
              url: RESUME_DATA.personalWebsiteUrl,
              title: "Personal Website",
            },
            ...RESUME_DATA.contact.social.map((socialMediaLink) => ({
              url: socialMediaLink.url,
              title: socialMediaLink.name,
            })),
          ]}
        />
      </body>
      <Analytics />
      <SpeedInsights />
    </html>
  );
}
