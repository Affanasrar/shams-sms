'use client'

import { Download, X, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function TeacherPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    const logs: string[] = []

    // Check if PWA already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      logs.push('✓ App already installed (running in standalone mode)')
    } else {
      logs.push('App not yet installed')
    }

    // Check if iOS
    const userAgent = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(userAgent)
    setIsIOS(isiOS)
    logs.push(`Device: ${isiOS ? 'iOS' : 'Android/Chrome'}`)

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]')
    logs.push(`Manifest found: ${manifestLink ? '✓' : '✗'}`)

    // Check service worker support
    logs.push(`Service Worker support: ${navigator.serviceWorker ? '✓' : '✗'}`)

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('✓ beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
      logs.push('✓ Install prompt available')
      setDebugInfo([...logs, '✓ beforeinstallprompt ready'])
    }

    const handleAppInstalled = () => {
      console.log('✓ App installed')
      setShowBanner(false)
      setDeferredPrompt(null)
    }

    // For debugging - if no prompt after 5 seconds, show banner anyway
    const timeoutId = setTimeout(() => {
      if (!deferredPrompt) {
        logs.push('⚠ No beforeinstallprompt after 5s - showing fallback banner')
        setDebugInfo(logs)
        if (!isiOS && !window.matchMedia('(display-mode: standalone)').matches) {
          setShowBanner(true)
        }
      }
    }, 5000)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    setDebugInfo(logs)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [deferredPrompt])

  const handleInstall = async () => {
    // If we have the prompt, use it
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
      setShowBanner(false)
    } else {
      // Fallback: show instructions
      if (isIOS) {
        alert('1. Tap Share\n2. Select "Add to Home Screen"\n3. Tap Add')
      } else {
        alert('Click the install button in your browser address bar, or:\n1. Tap Menu (3 dots)\n2. Select "Install app"')
      }
    }
  }

  if (!showBanner) return null

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between sticky top-16 md:top-0 z-40">
        <div className="flex items-center gap-3">
          <Download size={18} />
          <div>
            <div className="font-medium text-sm">
              {isIOS
                ? 'Add to Home Screen: Tap Share → Add to Home Screen'
                : 'Install Teacher Portal App'}
            </div>
            <div className="text-xs text-blue-100">
              {isIOS
                ? 'Get quick access from your home screen'
                : 'Easy offline access to attendance, results, and schedules'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-blue-50 transition"
          >
            {deferredPrompt ? 'Install' : 'How to'}
          </button>
          <button
            onClick={() => {
              setShowBanner(false)
              // Stop showing for this session
              sessionStorage.setItem('pwa-banner-dismissed', 'true')
            }}
            className="p-1 hover:bg-blue-700/50 rounded transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-1 hover:bg-blue-700/50 rounded transition"
            aria-label="Debug info"
            title="Debug info"
          >
            <AlertCircle size={18} />
          </button>
        </div>
      </div>

      {/* Debug Info Panel */}
      {showDebug && (
        <div className="bg-gray-900 text-gray-100 p-3 text-xs font-mono sticky top-20 md:top-12 z-40 border-b border-gray-700">
          <div className="max-h-40 overflow-y-auto space-y-1">
            {debugInfo.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
