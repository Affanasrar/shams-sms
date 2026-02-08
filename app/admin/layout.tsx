// app/admin/layout.tsx
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar"
import { CommandPaletteProvider } from "@/components/ui/command-palette"
import { DynamicBreadcrumbs } from "@/components/ui/dynamic-breadcrumbs"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Get the current User ID
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 2. 🔒 SECURITY GATE: Check Database Role
  const user = await prisma.user.findFirst({
    where: { clerkId: userId }
  });

  // 3. If NOT an Admin, kick them out to the Teacher Dashboard
  if (!user || user.role !== 'ADMIN') {
    console.log(`⚠️ Unauthorized Admin Access Attempt by: ${user?.email || userId}`);
    redirect("/teacher");
  }

  // ✅ Authorized: Render the Admin Interface
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <CollapsibleSidebar />
        
        {/* Main Content */}
        <main className="flex-1 ml-64 transition-all duration-300 sm:ml-20 md:ml-64">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <DynamicBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </CommandPaletteProvider>
  );
}