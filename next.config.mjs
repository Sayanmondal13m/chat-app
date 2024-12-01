/**
 *  @type {import('next').NextConfig} 
 */
import withpwa from "next-pwa";

const NextConfig = {
  distdir: "build",
  reactstrictmode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development", 
  }
}

export default withpwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  swSrc: './custom-sw.js',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json/],
})(NextConfig);