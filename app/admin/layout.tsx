// app/admin/layout.tsx
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server"; // 👈 New Import
import prisma from "@/lib/prisma";            // 👈 New Import
import { redirect } from "next/navigation";   // 👈 New Import
import Link from "next/link";
import { LayoutDashboard, Users, Calendar, DollarSign, BookOpen, Settings, CheckSquare } from "lucide-react";

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

  // ✅ Authorized: Render the Admin Interface (Your original design)
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider">SHAMS SMS</h1>
          <p className="text-xs text-gray-400">Admin Console</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavLink href="/admin" icon={<LayoutDashboard size={20}/>} label="Overview" />
          <NavLink href="/admin/students" icon={<Users size={20}/>} label="Students" />
          <NavLink href="/admin/enrollment" icon={<BookOpen size={20}/>} label="Enrollment" />
          <NavLink href="/admin/attendance" icon={<CheckSquare size={20}/>} label="Attendance" />
          <NavLink href="/admin/fees/dashboard" icon={<DollarSign size={20}/>} label="Fees Dashboard" />
          <NavLink href="/admin/schedule" icon={<Calendar size={20}/>} label="Timetable" />
          <NavLink href="/admin/results/new" icon={<BookOpen size={20}/>} label="Exam Entry" />
          <NavLink href="/admin/settings" icon={<Settings size={20}/>} label="Configuration" />
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800 bg-black">
           <div className="flex items-center gap-3">
             <UserButton afterSignOutUrl="/" />
             <span className="text-sm">My Profile</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:ml-64">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition">
      {icon}
      <span>{label}</span>
    </Link>
  )
}