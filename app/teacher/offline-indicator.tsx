'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { flushPendingAttendances } from '@/lib/offline'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      // Try to flush pending attendance records
      try {
        await flushPendingAttendances()
      } catch (err) {
        console.error('Error flushing pending attendance', err)
      }
      // briefly show success pill
      setVisible(true)
      setTimeout(() => setVisible(false), 2500)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`fixed top-safe right-4 z-50 p-2 rounded-full shadow-md flex items-center gap-2 ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
    </div>
  )
}
