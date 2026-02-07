import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'Shams Teacher Portal',
    short_name: 'Shams Teacher',
    description: 'Teacher dashboard for managing attendance, schedules, results, and reports',
    start_url: '/teacher',
    scope: '/teacher/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#0f3460',
    icons: [
      {
        src: '/icons/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['education', 'productivity'],
    shortcuts: [
      {
        name: 'Attendance',
        short_name: 'Attendance',
        description: 'Quick access to mark attendance',
        url: '/teacher/attendance',
        icons: [
          {
            src: '/icons/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Results',
        short_name: 'Results',
        description: 'Quick access to enter results',
        url: '/teacher/results',
        icons: [
          {
            src: '/icons/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Schedule',
        short_name: 'Schedule',
        description: 'Quick access to view schedule',
        url: '/teacher/schedule',
        icons: [
          {
            src: '/icons/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
