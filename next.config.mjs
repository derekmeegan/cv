/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    // Prefer modern, smaller formats; Vercel resizes sources to the display
    // size and serves AVIF/WebP instead of the original PNGs.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
