import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist_Mono, Libre_Franklin } from "next/font/google";
import { PROFILE } from "@/constants/profile";

import "./globals.css";
import React from "react";

const siteTitle = `${PROFILE.name} | ${PROFILE.about}`;
const siteDescription = PROFILE.summary;
// The link preview: the D m mark doing its wave. Messages on iOS and macOS
// plays the video in the link bubble; everything else shows the still.
// Both come from `pnpm preview:render`.
const previewImage = "/images/preview/dm.png";
// (a full address: unlike images, video tags are not resolved against
// metadataBase)
const previewVideo = new URL(
  "/images/preview/dm.mp4",
  PROFILE.personalWebsiteUrl,
).toString();
const previewSize = { width: 1200, height: 630 };

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.personalWebsiteUrl),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
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
        ...previewSize,
        type: "image/png",
        alt: "The D m mark: three figures with stars for heads",
      },
    ],
    // A direct link to the MP4 is what makes the preview move.
    videos: [
      {
        url: previewVideo,
        secureUrl: previewVideo,
        type: "video/mp4",
        ...previewSize,
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
// The site's typeface.
const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-libre-franklin",
});
// Only for code in articles, so it is not preloaded on every page.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${libreFranklin.variable} ${geistMono.variable}`}
    >
      <body className="font-sans" suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
