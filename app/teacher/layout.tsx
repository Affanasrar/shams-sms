// app/teacher/layout.tsx
'use client'

import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, CheckSquare, GraduationCap, Calendar, Menu, X, FileText } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from 'next/navigation'
// PWA banner removed
import OfflineIndicator from "./offline-indicator"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // show a tiny skeleton on first load to feel native
    const t = setTimeout(() => setIsLoading(false), 350)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // detect standalone / iOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) return

    // iOS Safari doesn't fire `beforeinstallprompt` — show a fallback banner
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isIos && isSafari) {
      setDeferredPrompt(null)
      setShowInstall(true)
    }

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <OfflineIndicator />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r fixed top-0 left-0 bottom-0 z-10 safe-padding">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
          <div>
            <div className="font-bold text-lg">Teacher Portal</div>
            <div className="text-xs text-gray-500">Easy classroom tools</div>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1 overflow-auto" aria-label="Teacher navigation">
          <NavLink href="/teacher" icon={<LayoutDashboard size={18}/>} label="Dashboard" active={pathname?.startsWith('/teacher') && pathname === '/teacher'} />
          <NavLink href="/teacher/attendance" icon={<CheckSquare size={18}/>} label="Attendance" active={pathname?.startsWith('/teacher/attendance')} />
          <NavLink href="/teacher/schedule" icon={<Calendar size={18}/>} label="Schedule" active={pathname?.startsWith('/teacher/schedule')} />
          <NavLink href="/teacher/reports" icon={<FileText size={18}/>} label="Reports" active={pathname?.startsWith('/teacher/reports')} />
          <NavLink href="/teacher/results" icon={<GraduationCap size={18}/>} label="Results" active={pathname?.startsWith('/teacher/results')} />
        </nav>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-sm">
              <div className="font-medium">My Account</div>
              <div className="text-xs text-gray-500">Sign out available</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-20 safe-padding pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { setIsMobileMenuOpen(true); try { navigator.vibrate?.(8) } catch {} }} aria-label="Open menu" className="p-2 rounded-md hover:bg-gray-100 -ml-2">
              <Menu size={20} />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <div className="font-semibold">Teacher</div>
          </div>
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
                <div className="font-bold">Teacher Portal</div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-gray-100"><X size={20} /></button>
            </div>
            <nav className="space-y-2" aria-label="Mobile teacher navigation">
              <MobileNavLink href="/teacher" icon={<LayoutDashboard size={18}/>} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} active={pathname === '/teacher'} />
              <MobileNavLink href="/teacher/attendance" icon={<CheckSquare size={18}/>} label="Attendance" onClick={() => setIsMobileMenuOpen(false)} active={pathname?.startsWith('/teacher/attendance')} />
              <MobileNavLink href="/teacher/schedule" icon={<Calendar size={18}/>} label="Schedule" onClick={() => setIsMobileMenuOpen(false)} active={pathname?.startsWith('/teacher/schedule')} />
              <MobileNavLink href="/teacher/reports" icon={<FileText size={18}/>} label="Reports" onClick={() => setIsMobileMenuOpen(false)} active={pathname?.startsWith('/teacher/reports')} />
              <MobileNavLink href="/teacher/results" icon={<GraduationCap size={18}/>} label="Results" onClick={() => setIsMobileMenuOpen(false)} active={pathname?.startsWith('/teacher/results')} />
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30" role="navigation" aria-label="Bottom navigation">
        <div className="flex justify-between px-4 py-2">
          <MobileIcon href="/teacher" label="Home" icon={<LayoutDashboard size={18} />} active={pathname === '/teacher'} />
          <MobileIcon href="/teacher/attendance" label="Attend" icon={<CheckSquare size={18} />} active={pathname?.startsWith('/teacher/attendance')} />
          <MobileIcon href="/teacher/schedule" label="Schedule" icon={<Calendar size={18} />} active={pathname?.startsWith('/teacher/schedule')} />
          <MobileIcon href="/teacher/reports" label="Reports" icon={<FileText size={18} />} active={pathname?.startsWith('/teacher/reports')} />
          <MobileIcon href="/teacher/results" label="Results" icon={<GraduationCap size={18} />} active={pathname?.startsWith('/teacher/results')} />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 pt-20 md:pt-8 px-4 md:px-8 pb-24 md:pb-8 safe-padding-bottom">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-6 w-3/5 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-28 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          children
        )}
        {showInstall && (
          <div className="fixed bottom-6 left-6 right-6 md:right-6 md:left-auto z-50 bg-white border rounded-lg shadow-lg p-3 flex items-center gap-3 justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">Install Shams</div>
              <div className="text-xs text-gray-500">Get quick access to attendance</div>
            </div>
            <div>
              {deferredPrompt ? (
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                    if (!deferredPrompt) return
                    try {
                      await deferredPrompt.prompt()
                      setShowInstall(false)
                    } catch (err) {
                      console.error(err)
                    }
                  }} className="px-3 py-1 bg-blue-600 text-white rounded">Install</button>
                  <button onClick={() => setShowInstall(false)} className="px-2 py-1 text-sm text-gray-600">Dismiss</button>
                </div>
              ) : (
                // iOS fallback instructions
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowInstall(false)} className="px-3 py-1 bg-blue-600 text-white rounded">Got it</button>
                  <div className="text-xs text-gray-600">Tap Share → Add to Home Screen</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function NavLink({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-3 min-h-12 rounded-lg transition-colors font-medium touch-target ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function MobileNavLink({ href, icon, label, onClick, active }: { href: string, icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
        aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-3 min-h-12 rounded-lg transition-colors font-medium text-lg touch-target ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function MobileIcon({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={`flex-1 flex flex-col items-center justify-center text-xs min-h-12 touch-target ${active ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`} onClick={() => { try { navigator.vibrate?.(6) } catch {} }}>
      <div className="p-1 relative">
        {icon}
        {/* active dot indicator */}
        <span className={`absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-2 h-2 rounded-full ${active ? 'bg-blue-600 shadow-md' : 'bg-transparent'}`} />
      </div>
      <div className="mt-0.5">{label}</div>
    </Link>
  )
}