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
  { icon: <Trash2 size={20} />, label: "Cleanup", href: "/admin/students/cleanup" },
  { icon: <BookOpen size={20} />, label: "Enrollment", href: "/admin/enrollment" },
  { icon: <CheckSquare size={20} />, label: "Attendance", href: "/admin/attendance" },
  { icon: <DollarSign size={20} />, label: "Fees", href: "/admin/fees/dashboard" },
  { icon: <Calendar size={20} />, label: "Schedule", href: "/admin/schedule" },
  { icon: <BookOpen size={20} />, label: "Results", href: "/admin/results/new" },
  { icon: <Settings size={20} />, label: "Settings", href: "/admin/settings" },
]

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Update CSS variable when collapsed state changes
  useEffect(() => {
    const sidebarWidth = collapsed ? '80px' : '256px'
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth)
  }, [collapsed])

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen transition-all duration-300 z-20 flex flex-col border-r",
        collapsed ? "w-20" : "w-64"
      )}
      style={{
        backgroundColor: '#1a202c',
        borderColor: '#2d3748',
      }}
    >
      {/* Logo Section */}
      <div 
        className="p-6 flex items-center justify-between border-b"
        style={{ borderColor: '#2d3748' }}
      >
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-white truncate">
              SHAMS SMS
            </h1>
            <p className="text-xs text-gray-400 truncate">Admin Console</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hover:bg-gray-700"
          style={{ color: '#cbd5e1' }}
        >
          <ChevronLeft
            size={20}
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2 scrollbar-hide" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm truncate",
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">
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
      <div 
        className="p-4 border-t flex items-center gap-3 flex-shrink-0"
        style={{ borderColor: '#2d3748' }}
      >
        <div className="flex-shrink-0">
          <UserButton afterSignOutUrl="/" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin</p>
            <p className="text-xs text-gray-400 truncate">Account</p>
          </div>
        )}
      </div>
    </aside>
  )
}
