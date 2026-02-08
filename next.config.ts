import type { NextConfig } from "next";
import withPWA from 'next-pwa'

const pwaConfig = {
  dest: 'public',
  cacheOnFrontEndNav: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Cache teacher student list using StaleWhileRevalidate
      urlPattern: /^\/api\/teacher\/class-students(.*)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'teacher-class-students',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
}

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA(pwaConfig)(nextConfig as any);
