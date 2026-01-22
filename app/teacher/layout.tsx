// app/teacher/layout.tsx
import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, CheckSquare, GraduationCap, Calendar } from "lucide-react"
import Link from "next/link"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Teacher Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:block fixed h-full z-10">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="font-bold text-lg">Teacher Portal</span>
        </div>
        
        <nav className="p-4 space-y-1">
          <NavLink href="/teacher" icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <NavLink href="/teacher/attendance" icon={<CheckSquare size={20}/>} label="Mark Attendance" />
          <NavLink href="/teacher/results" icon={<GraduationCap size={20}/>} label="Exam Results" />
          <NavLink href="/teacher/schedule" icon={<Calendar size={20}/>} label="My Schedule" />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm font-medium text-gray-600">My Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}