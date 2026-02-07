'use client'

import { useEffect } from 'react'

export default function PWAInstaller() {
  useEffect(() => {
    // Register service worker with better error handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/teacher/' })
        .then((registration) => {
          console.log('✓ Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('✗ Service Worker registration failed:', error)
        })

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('✓ New service worker activated')
      })
    } else {
      console.warn('⚠ Service Worker not supported in this browser')
    }

    // Log manifest status
    const manifestLink = document.querySelector('link[rel="manifest"]')
    if (manifestLink) {
      fetch('/manifest.json')
        .then((res) => {
          if (res.ok) {
            console.log('✓ Manifest.json is accessible')
          } else {
            console.error('✗ Manifest.json returned status:', res.status)
          }
        })
        .catch((err) => {
          console.error('✗ Failed to fetch manifest:', err)
        })
    } else {
      console.warn('⚠ Manifest link not found in HTML head')
    }

    // Log PWA readiness
    console.log('PWA Status:', {
      serviceWorker: navigator.serviceWorker ? 'Supported' : 'Not supported',
      standalone: window.matchMedia('(display-mode: standalone)').matches ? 'App mode' : 'Browser mode',
      online: navigator.onLine ? 'Online' : 'Offline',
      https: window.location.protocol === 'https:' ? 'Yes' : 'No (local ok)',
    })
  }, [])

  return null
}
