"use client"

import React, { useState } from "react"
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
} from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: "Overview", href: "/admin" },
  { icon: <Users size={20} />, label: "Students", href: "/admin/students" },
  { icon: <Trash2 size={20} />, label: "Fees Cleanup", href: "/admin/students/cleanup" },
  { icon: <BookOpen size={20} />, label: "Enrollment", href: "/admin/enrollment" },
  { icon: <CheckSquare size={20} />, label: "Attendance", href: "/admin/attendance" },
  { icon: <DollarSign size={20} />, label: "Fees Dashboard", href: "/admin/fees/dashboard" },
  { icon: <Calendar size={20} />, label: "Timetable", href: "/admin/schedule" },
  { icon: <BookOpen size={20} />, label: "Exam Entry", href: "/admin/results/new" },
  { icon: <Settings size={20} />, label: "Configuration", href: "/admin/settings" },
]

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar-glass border-r border-sidebar-border transition-all duration-300 z-20 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground truncate">
              SHAMS SMS
            </h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">Admin Console</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent/10"
        >
          <ChevronLeft
            size={20}
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors duration-200",
                "text-sidebar-foreground hover:bg-sidebar-accent/10",
                isActive && "bg-primary text-primary-foreground hover:bg-primary"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-6 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 bg-sidebar-accent/5 p-3 rounded-lg">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
          {!collapsed && <span className="text-xs text-sidebar-foreground truncate">My Profile</span>}
        </div>
      </div>
    </aside>
  )
}
