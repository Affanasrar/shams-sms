// PWA Configuration - Customize these settings as needed
// Located at: public/pwa-config.ts or in your environment

export const PWA_CONFIG = {
  // Cache configuration
  cache: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours in milliseconds
    staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
  },

  // Notification configuration
  notifications: {
    enabled: true,
    defaultTitle: 'Shams Teacher Portal',
    defaultIcon: '/icons/icon-192.png',
    defaultBadge: '/icons/icon-96.png',
  },

  // Service worker settings
  serviceWorker: {
    scope: '/teacher/',
    enabled: process.env.NODE_ENV === 'production',
    skipWaiting: true,
  },

  // App metadata
  app: {
    name: 'Shams Teacher Portal',
    shortName: 'Shams Teacher',
    description: 'Teacher dashboard for managing attendance, schedules, results, and reports',
    themeColor: '#0f3460',
    backgroundColor: '#ffffff',
  },

  // Routes to cache on install
  routesToCache: [
    '/teacher/',
    '/teacher/attendance',
    '/teacher/schedule',
    '/teacher/results',
    '/teacher/reports',
  ],

  // Routes to exclude from caching
  routesToExclude: [
    '/api/',
    '/admin/',
    '/auth/',
    '/sign-in',
    '/sign-up',
  ],

  // Offline fallback page
  offlineFallback: '/teacher/',

  // Enable/disable PWA features
  features: {
    offlineMode: true,
    pushNotifications: true,
    backgroundSync: false, // Requires additional configuration
    periodicSync: false, // Requires additional configuration
    shortcuts: true,
  },
};

export default PWA_CONFIG;
