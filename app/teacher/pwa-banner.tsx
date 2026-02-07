'use client'

import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function TeacherPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if iOS
    const userAgent = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent))

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between sticky top-16 md:top-0 z-40">
      <div className="flex items-center gap-3">
        <Download size={18} />
        <div>
          <div className="font-medium text-sm">
            {isIOS
              ? 'Add to Home Screen: Tap Share → Add to Home Screen'
              : 'Install Teacher Portal App'
            }
          </div>
          <div className="text-xs text-blue-100">
            {isIOS
              ? 'Get quick access from your home screen'
              : 'Easy access to attendance, results, and schedules'
            }
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-blue-50 transition"
          >
            Install
          </button>
        )}
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 hover:bg-blue-700/50 rounded transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
