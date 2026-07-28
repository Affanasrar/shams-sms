// app/admin/layout-client.tsx
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Users, DollarSign, BookOpen, Menu, X,
  CheckSquare, Calendar, Settings, MessageSquare, UserX,
  Trash2, GraduationCap, Receipt, MoreHorizontal
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui'

const MOBILE_BOTTOM_NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Home' },
  { href: '/admin/students', icon: Users, label: 'Students' },
  { href: '/admin/fees/dashboard', icon: DollarSign, label: 'Fees' },
  { href: '/admin/enrollment', icon: BookOpen, label: 'Enroll' },
]

const ALL_NAV = [
  { section: 'Core', items: [
    { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/attendance', icon: CheckSquare, label: 'Attendance' },
  ]},
  { section: 'Operations', items: [
    { href: '/admin/enrollment', icon: BookOpen, label: 'Enrollment' },
    { href: '/admin/completed-students', icon: GraduationCap, label: 'Completions' },
    { href: '/admin/dropped-students', icon: UserX, label: 'Dropped' },
    { href: '/admin/students/cleanup', icon: Trash2, label: 'Cleanup' },
    { href: '/admin/schedule', icon: Calendar, label: 'Schedule' },
  ]},
  { section: 'Finance', items: [
    { href: '/admin/fees/dashboard', icon: DollarSign, label: 'Fees' },
    { href: '/admin/expenses', icon: Receipt, label: 'Expenses' },
    { href: '/admin/results/new', icon: BookOpen, label: 'Results' },
    { href: '/admin/sms', icon: MessageSquare, label: 'SMS' },
  ]},
  { section: 'System', items: [
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ]},
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))

  return (
    <>
      {/* Mobile Topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-slate-950 text-white z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 -ml-2"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center text-white font-bold text-xs">S</div>
              <span className="font-semibold text-sm">SHAMS Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 text-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center text-white font-bold text-xs">S</div>
                <span className="font-bold">SHAMS SMS</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <nav className="p-3 space-y-4">
              {ALL_NAV.map((group) => (
                <div key={group.section}>
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{group.section}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                            active
                              ? 'bg-indigo-500/20 text-white'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <div className="text-sm">
                    <div className="font-medium text-white">Admin</div>
                    <div className="text-xs text-slate-400">Account access</div>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30" role="navigation" aria-label="Bottom navigation">
        <div className="flex justify-between px-2 py-2">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center text-xs py-1 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Icon size={18} />
                <span className="mt-0.5">{item.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />}
              </Link>
            )
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center text-xs py-1 text-slate-500 dark:text-slate-400"
          >
            <MoreHorizontal size={18} />
            <span className="mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main
        className="flex-1 min-h-screen transition-all duration-300 ease-in-out pt-14 md:pt-0 pb-20 md:pb-0 bg-slate-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
        style={{
          marginLeft: 'var(--sidebar-width, 256px)',
        }}
      >
        {/* On mobile, reset marginLeft since sidebar is hidden */}
        <style>{`
          @media (max-width: 767px) {
            main { margin-left: 0 !important; }
          }
        `}</style>
        <div className="p-4 md:p-8 w-full">
          {children}
        </div>
      </main>
    </>
  )
}

