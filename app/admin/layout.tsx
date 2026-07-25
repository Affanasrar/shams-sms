// app/admin/layout.tsx
import { requireAdminRole } from "@/lib/auth-utils"
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar"
import { DynamicBreadcrumbs } from "@/components/ui/dynamic-breadcrumbs"
import AdminLayoutClient from "./layout-client"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ✅ SERVER-SIDE VERIFICATION: Enforce admin role before rendering
  // If user is not authenticated or not an admin, this will redirect to home
  await requireAdminRole()

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f0f4f8' }}>
      <CollapsibleSidebar />
      <AdminLayoutClient>
        <DynamicBreadcrumbs />
        {children}
      </AdminLayoutClient>
    </div>
  )
}