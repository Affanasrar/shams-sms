// app/teacher/layout.tsx
'use client'

import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, CheckSquare, GraduationCap, Calendar, Menu, X, FileText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from 'next/navigation'
// PWA banner removed
import OfflineIndicator from "./offline-indicator"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

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
            <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" className="p-2 rounded-md hover:bg-gray-100 -ml-2">
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
        {children}
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
    <Link href={href} aria-current={active ? 'page' : undefined} className={`flex-1 flex flex-col items-center justify-center text-xs min-h-12 touch-target ${active ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
      <div className="p-1">{icon}</div>
      <div className="mt-0.5">{label}</div>
    </Link>
  )
}