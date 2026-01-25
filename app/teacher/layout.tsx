// app/teacher/layout.tsx
'use client'

import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, CheckSquare, GraduationCap, Calendar, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Teacher Sidebar - Desktop */}
      <aside className="w-64 bg-white border-r md:block hidden fixed h-full z-10">
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

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="font-bold text-lg">Teacher Portal</span>
        </div>
        
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div className="md:hidden fixed top-0 left-0 w-64 h-full bg-white z-40 shadow-lg">
            <div className="p-6 border-b flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                T
              </div>
              <span className="font-bold text-lg">Teacher Portal</span>
            </div>
            
            <nav className="p-4 space-y-2">
              <MobileNavLink href="/teacher" icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/teacher/attendance" icon={<CheckSquare size={20}/>} label="Mark Attendance" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/teacher/results" icon={<GraduationCap size={20}/>} label="Exam Results" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/teacher/schedule" icon={<Calendar size={20}/>} label="My Schedule" onClick={() => setIsMobileMenuOpen(false)} />
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-gray-50">
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
                <span className="text-sm font-medium text-gray-600">My Account</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="md:ml-64 flex-1 pt-16 md:pt-8 px-4 md:px-8 pb-8">
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

function MobileNavLink({ href, icon, label, onClick }: { href: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium text-lg"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}