import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  pwa: {
    dest: 'public', // The folder where the service worker and assets are stored
    register: true, // Automatically register the service worker
    skipWaiting: true, // Activate the new service worker as soon as it's available
  },
});

export default nextConfig;
