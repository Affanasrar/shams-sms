'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function PWADiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState({
    manifest: false,
    serviceWorker: false,
    https: false,
    installSupported: false,
    standalone: false,
    online: true,
    icons: false,
    swRegistered: false,
  })

  const [error, setError] = useState('')

  const runDiagnostics = async () => {
    const newDiagnostics = { ...diagnostics }

    // Check HTTPS
    newDiagnostics.https =
      window.location.protocol === 'https:' || window.location.hostname === 'localhost'

    // Check manifest
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]')
      if (manifestLink) {
        const res = await fetch('/manifest.json')
        newDiagnostics.manifest = res.ok
      }
    } catch (e) {
      console.error('Manifest check failed:', e)
    }

    // Check service worker support
    newDiagnostics.serviceWorker = 'serviceWorker' in navigator

    // Check if service worker registered
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        newDiagnostics.swRegistered = registrations.length > 0
      } catch (e) {
        console.error('SW registration check failed:', e)
      }
    }

    // Check standalone mode
    newDiagnostics.standalone = window.matchMedia('(display-mode: standalone)').matches

    // Check install support
    newDiagnostics.installSupported = 'beforeinstallprompt' in window

    // Check online status
    newDiagnostics.online = navigator.onLine

    // Check icons
    try {
      const iconRes = await fetch('/icons/favicon-96x96.png')
      newDiagnostics.icons = iconRes.ok
    } catch (e) {
      console.error('Icons check failed:', e)
    }

    setDiagnostics(newDiagnostics)
  }

  useEffect(() => {
    runDiagnostics()

    // Re-check on online/offline
    const handleOnline = () => {
      setDiagnostics((prev) => ({ ...prev, online: true }))
    }
    const handleOffline = () => {
      setDiagnostics((prev) => ({ ...prev, online: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const items = [
    {
      key: 'https',
      label: 'HTTPS/Secure Connection',
      hint: 'Required for PWA features',
    },
    {
      key: 'manifest',
      label: 'Web App Manifest',
      hint: 'Defines app metadata',
    },
    {
      key: 'serviceWorker',
      label: 'Service Worker Support',
      hint: 'Browser supports service workers',
    },
    {
      key: 'swRegistered',
      label: 'Service Worker Registered',
      hint: 'SW is active and running',
    },
    {
      key: 'installSupported',
      label: 'Install Prompt Support',
      hint: 'Browser can show install prompt',
    },
    {
      key: 'icons',
      label: 'App Icons Available',
      hint: 'Icon files are accessible',
    },
    {
      key: 'online',
      label: 'Network Connection',
      hint: 'Currently online/offline',
    },
    {
      key: 'standalone',
      label: 'Standalone Mode',
      hint: 'App is running in installed mode',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PWA Diagnostics</h1>
              <p className="text-gray-600 mt-2">Check your app's Progressive Web App readiness</p>
            </div>
            <button
              onClick={runDiagnostics}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className={`p-4 rounded-lg border-l-4 flex items-center justify-between ${
                  diagnostics[item.key as keyof typeof diagnostics]
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div>
                  <div className="font-semibold text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.hint}</div>
                </div>
                {diagnostics[item.key as keyof typeof diagnostics] ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <XCircle className="text-red-600" size={24} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>

            {!diagnostics.https && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4 flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-yellow-900">HTTPS Required</div>
                  <p className="text-sm text-yellow-800">
                    Deploy to production with HTTPS enabled. PWA features only work on secure connections.
                  </p>
                </div>
              </div>
            )}

            {!diagnostics.manifest && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4 flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-yellow-900">Manifest Missing</div>
                  <p className="text-sm text-yellow-800">
                    Ensure <code className="bg-yellow-200 px-1">public/manifest.json</code> exists and is linked in HTML head.
                  </p>
                </div>
              </div>
            )}

            {!diagnostics.swRegistered && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4 flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-yellow-900">Service Worker Not Registered</div>
                  <p className="text-sm text-yellow-800">
                    Check browser console for errors. Service Worker file should be at <code className="bg-yellow-200 px-1">public/sw.js</code>
                  </p>
                </div>
              </div>
            )}

            {!diagnostics.installSupported && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4 flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-blue-900">Install Prompt Not Available</div>
                  <p className="text-sm text-blue-800">
                    This is normal on dev/localhost. The <code className="bg-blue-200 px-1">beforeinstallprompt</code> event requires certain PWA criteria. A fallback banner will still show.
                  </p>
                </div>
              </div>
            )}

            {diagnostics.installSupported && diagnostics.manifest && diagnostics.swRegistered && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-green-900">✓ PWA Ready!</div>
                  <p className="text-sm text-green-800">
                    Your app meets all PWA requirements. Users can install it on their devices.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Browser Console Logs</h2>
            <p className="text-sm text-gray-600 mb-4">
              Open browser DevTools (Press F12) → Console tab to see detailed diagnostic logs.
            </p>
            <p className="text-xs text-gray-500 font-mono bg-gray-100 p-3 rounded">
              Look for messages starting with ✓ (success), ✗ (error), or ⚠ (warning)
            </p>
          </div>

          <div className="mt-8">
            <a
              href="/teacher"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
