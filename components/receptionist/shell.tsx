'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserPlus,
  BookOpen,
  Menu,
  X,
  CalendarDays,
  Sparkles,
  BadgeCheck
} from 'lucide-react'
import { ReactNode } from 'react'

const navItems = [
  { href: '/receptionist', label: 'Dashboard', icon: <LayoutDashboard size={18} />, description: 'Overview' },
  { href: '/receptionist/students/new', label: 'Admission', icon: <UserPlus size={18} />, description: 'Add student' },
  { href: '/receptionist/students', label: 'Students', icon: <Users size={18} />, description: 'Directory' },
  { href: '/receptionist/enrollment/new', label: 'Enrollment', icon: <BookOpen size={18} />, description: 'New assignment' },
  { href: '/receptionist/enrollment', label: 'Enrollments', icon: <Calendar size={18} />, description: 'Active list' },
  { href: '/receptionist/schedule', label: 'Schedule', icon: <CalendarDays size={18} />, description: 'Rooms & timings' }
]

export default function ReceptionistShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const currentRouteLabel = useMemo(() => {
    const activeItem = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    return activeItem?.label || 'Dashboard'
  }, [pathname])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] text-slate-900">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-80 flex-col border-r border-slate-200/80 bg-slate-950 text-slate-100 shadow-[16px_0_40px_-28px_rgba(2,6,23,0.9)] backdrop-blur-xl xl:flex">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-950/30">
                R
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/80">Receptionist desk</p>
                <h1 className="mt-1 text-lg font-semibold text-white">Shams SMS</h1>
                <p className="text-sm text-slate-400">Admissions, enrollments, schedules</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-cyan-200">
              <Sparkles size={14} />
              <span className="text-xs font-semibold uppercase tracking-[0.26em]">Receptionist flow</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Manage admissions, student placement, and room visibility from a single streamlined workspace.
            </p>
          </div>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-label="Receptionist navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/receptionist' && pathname.startsWith(`${item.href}/`))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-3xl px-4 py-3 transition ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-[0_10px_30px_-18px_rgba(255,255,255,0.6)]'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${isActive ? 'bg-slate-950/5 text-cyan-600' : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{item.label}</span>
                  <span className={`block text-xs ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>{item.description}</span>
                </span>
                {isActive && <BadgeCheck size={16} className="text-cyan-600" />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Receptionist</p>
              <p className="truncate text-xs text-slate-400">Account access</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl xl:hidden">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              <Menu size={20} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-950/20">
              R
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Receptionist desk</p>
              <p className="text-sm font-semibold text-slate-900">{currentRouteLabel}</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="scrollbar-hide absolute left-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-950/20">
                  R
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Receptionist desk</p>
                  <p className="font-semibold text-slate-900">Shams SMS</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-cyan-700">
                  <Sparkles size={14} />
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">Receptionist flow</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Navigate admissions, enrollments, and schedules from a polished mobile drawer.
                </p>
              </div>
            </div>

            <nav className="space-y-2 px-3 pb-4" aria-label="Mobile receptionist navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/receptionist' && pathname.startsWith(`${item.href}/`))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-3xl px-4 py-3 transition ${
                      isActive ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isActive ? 'bg-cyan-100' : 'bg-slate-100'}`}>
                      {item.icon}
                    </span>
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="block text-xs text-slate-500">{item.description}</span>
                    </span>
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 p-3">
                <UserButton afterSignOutUrl="/" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Receptionist</p>
                  <p className="text-xs text-slate-500">Account access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen xl:pl-80">
        <div className="px-4 pb-8 pt-4 sm:px-6 xl:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
