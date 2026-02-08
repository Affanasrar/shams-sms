// app/admin/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar"
import { DynamicBreadcrumbs } from "@/components/ui/dynamic-breadcrumbs"
import { useAuth } from "@clerk/nextjs"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!userId) {
      router.push("/sign-in")
      return
    }

    // For now, allow access if user is authenticated
    // In production, you'd check the database role here
    setIsAuthorized(true)
  }, [isLoaded, userId, router])

  if (!isLoaded || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f0f4f8' }}>
      <CollapsibleSidebar />
      
      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300 ease-in-out" 
        style={{ 
          backgroundColor: '#f0f4f8', 
          marginLeft: 'var(--sidebar-width, 256px)'
        }}
      >
        <div className="p-4 md:p-8 w-full">
          <DynamicBreadcrumbs />
          {children}
        </div>
      </main>
    </div>
  )
}