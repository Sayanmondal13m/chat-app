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
  register: true,
  skipWaiting: true,
})(NextConfig);
