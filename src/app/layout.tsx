import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist_Mono } from "next/font/google";
import { PROFILE } from "@/constants/profile";
import Link from "next/link";

import "./globals.css";
import React from "react";

const siteTitle = `${PROFILE.name} | ${PROFILE.about}`;
const siteDescription = PROFILE.summary;
const previewImage = "/images/cool-sky-og.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.personalWebsiteUrl),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: PROFILE.personalWebsiteUrl,
    siteName: PROFILE.name,
    type: "website",
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: "Blue sky gradient",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage],
  },
};
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body className="font-mono font-light" suppressHydrationWarning>
        <main className="container relative mx-auto scroll-my-12 overflow-auto p-4 md:p-16 print:p-12">
          <section className="mx-auto w-full max-w-2xl space-y-8 bg-white print:space-y-6">
            <div className="flex flex-row gap-10 font-mono text-sm text-muted-foreground">
              <Link href="/">About</Link>
              <Link href="/students">Students</Link>
              <Link href="/writing">Writing</Link>
            </div>
            {children}
          </section>
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
