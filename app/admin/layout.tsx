// app/admin/layout.tsx
import { requireAdminRole } from "@/lib/auth-utils"
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar"
import { DynamicBreadcrumbs } from "@/components/ui/dynamic-breadcrumbs"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ✅ SERVER-SIDE VERIFICATION: Enforce admin role before rendering
  // If user is not authenticated or not an admin, this will redirect to home
  await requireAdminRole()

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