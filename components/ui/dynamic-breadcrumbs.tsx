"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbSegment {
  label: string
  href?: string
}

const ROUTE_LABELS: Record<string, string> = {
  admin: "Dashboard",
  students: "Students",
  enrollment: "Enrollment",
  fees: "Fees",
  attendance: "Attendance",
  schedule: "Timetable",
  results: "Exam Results",
  settings: "Settings",
  dashboard: "Dashboard",
  "fees-dashboard": "Fees Dashboard",
  "cleanup": "Fees Cleanup",
  "new": "New Entry",
  "by-course": "By Course",
  reports: "Reports",
  discounts: "Discounts",
  "report-format-config": "Report Format",
}

export function DynamicBreadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on admin homepage
  if (pathname === "/admin") {
    return null
  }

  const segments: BreadcrumbSegment[] = [{ label: "Dashboard", href: "/admin" }]
  const pathParts = pathname.split("/").filter(Boolean)

  let currentPath = ""
  for (let i = 1; i < pathParts.length; i++) {
    currentPath += `/${pathParts[i]}`
    const label = ROUTE_LABELS[pathParts[i]] || pathParts[i].charAt(0).toUpperCase() + pathParts[i].slice(1)
    
    // Only add as link if it's not the last segment
    if (i < pathParts.length - 1) {
      segments.push({ label, href: currentPath })
    } else {
      segments.push({ label })
    }
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      {segments.map((segment, index) => (
        <React.Fragment key={segment.href || segment.label}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          {segment.href ? (
            <Link
              href={segment.href}
              className="text-primary hover:underline transition-colors"
            >
              {segment.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{segment.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
