import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
