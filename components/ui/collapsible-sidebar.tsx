"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  Settings,
  CheckSquare,
  Trash2,
  ChevronLeft,
  MessageSquare,
  UserX,
  Sparkles,
} from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core",
    items: [
      { icon: <LayoutDashboard size={18} />, label: "Overview", href: "/admin" },
      { icon: <Users size={18} />, label: "Students", href: "/admin/students" },
      { icon: <CheckSquare size={18} />, label: "Attendance", href: "/admin/attendance" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: <BookOpen size={18} />, label: "Enrollment", href: "/admin/enrollment" },
      { icon: <UserX size={18} />, label: "Dropped Students", href: "/admin/dropped-students" },
      { icon: <Trash2 size={18} />, label: "Cleanup", href: "/admin/students/cleanup" },
      { icon: <Calendar size={18} />, label: "Schedule", href: "/admin/schedule" },
    ],
  },
  {
    title: "Finance & Communication",
    items: [
      { icon: <DollarSign size={18} />, label: "Fees", href: "/admin/fees/dashboard" },
      { icon: <BookOpen size={18} />, label: "Results", href: "/admin/results/new" },
      { icon: <MessageSquare size={18} />, label: "SMS", href: "/admin/sms" },
    ],
  },
  {
    title: "System",
    items: [{ icon: <Settings size={18} />, label: "Settings", href: "/admin/settings" }],
  },
]

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const sidebarWidth = collapsed ? "80px" : "256px"
    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth)
  }, [collapsed])

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-20 flex h-screen flex-col border-r bg-slate-950/95 text-slate-100 shadow-[20px_0_60px_-30px_rgba(2,6,23,0.9)] backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        {!collapsed && (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white shadow-lg">
                S
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-semibold tracking-tight text-white">SHAMS SMS</h1>
                <p className="truncate text-xs text-slate-400">Admin Console</p>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={18} className={cn("transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <div className="px-3 py-3">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            <Sparkles size={16} className="text-sky-300" />
            <span>Premium operating view</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{group.title}</p>}
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "bg-linear-to-r from-indigo-500/25 to-sky-500/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", isActive ? "bg-white/10" : "bg-white/5")}>{item.icon}</div>
                    {!collapsed && (
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                    )}
                    {!collapsed && item.badge ? (
                      <span className="rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">{item.badge}</span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Admin</p>
              <p className="truncate text-xs text-slate-400">Account access</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
