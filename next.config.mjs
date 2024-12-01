import withPWA from "next-pwa";

const NextConfig = {
  distDir: "build",
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development",
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  swSrc: './custom-sw.js', // Ensure the correct path
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json/],
})(NextConfig);