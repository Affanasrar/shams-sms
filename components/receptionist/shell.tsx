'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboard, Users, Calendar, UserPlus, BookOpen, Menu, X, CalendarDays } from 'lucide-react'
import { ReactNode } from 'react'

const navItems = [
  { href: '/receptionist', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/receptionist/students/new', label: 'Admission', icon: <UserPlus size={18} /> },
  { href: '/receptionist/students', label: 'Students', icon: <Users size={18} /> },
  { href: '/receptionist/enrollment/new', label: 'Enrollment', icon: <BookOpen size={18} /> },
  { href: '/receptionist/enrollment', label: 'Enrollments', icon: <Calendar size={18} /> },
  { href: '/receptionist/schedule', label: 'Schedule', icon: <CalendarDays size={18} /> }
]

export default function ReceptionistShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden md:flex flex-col w-72 bg-white border-r fixed top-0 left-0 bottom-0 z-10 safe-padding">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-sky-700 rounded-lg flex items-center justify-center text-white font-bold">R</div>
          <div>
            <div className="font-bold text-lg">Receptionist</div>
            <div className="text-xs text-gray-500">Fast admissions & schedules</div>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1 overflow-auto" aria-label="Receptionist navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium touch-target ${pathname === item.href ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-100 hover:text-cyan-700'}`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div>
              <div className="text-sm font-medium">Account</div>
              <div className="text-xs text-gray-500">Sign out anytime</div>
            </div>
          </div>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-20 safe-padding pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" className="p-2 rounded-md hover:bg-slate-100 -ml-2">
              <Menu size={20} />
            </button>
            <div className="w-9 h-9 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <div className="font-semibold">Receptionist</div>
          </div>
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                <div className="font-bold">Receptionist</div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-slate-100"><X size={20} /></button>
            </div>
            <nav className="space-y-2" aria-label="Mobile receptionist navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${pathname === item.href ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-100 hover:text-cyan-700'}`}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-72 pt-20 md:pt-8 px-4 md:px-8 pb-24 md:pb-8 safe-padding-bottom">
        {children}
      </main>
    </div>
  )
}
