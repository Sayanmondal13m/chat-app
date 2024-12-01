/**
 * @type {import('next').NextConfig}
 */
import withPWA from "next-pwa";

const NextConfig = {
  distDir: "build", // This changes the default .next directory to build
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development",
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  swSrc: './custom-sw.js', // Path to your custom service worker
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json/],
})(NextConfig);