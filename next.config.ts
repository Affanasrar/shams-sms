import type { NextConfig } from "next";
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
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
  },
})

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);
