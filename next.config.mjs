/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    // Vercel resizes sources to the display size and serves WebP instead of
    // the originals. Not AVIF: the first request for each size is made on
    // the spot, and for the gallery's paintings AVIF took twice as long to
    // make as WebP for files of the same size.
    formats: ["image/webp"],
    // Keep each resized image for a month rather than four hours, so a
    // visitor is rarely the one who waits for it to be made. (An image
    // replaced under the same file name can stay stale that long: rename it.)
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
