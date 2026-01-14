import type { NextConfig } from "next";
import withPWA from "next-pwa";
import { generateRedirects } from "./src/lib/routes";

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return generateRedirects();
  },
  output: "standalone"
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
