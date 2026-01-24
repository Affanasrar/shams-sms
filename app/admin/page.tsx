// app/admin/page.tsx
import prisma from '@/lib/prisma'
import { Card } from '@/components/ui/card' // Assuming you have shadcn cards, or use div
import Link from 'next/link'
import { UserPlus, Users, DollarSign, Calendar, FileText, GraduationCap } from 'lucide-react'

export default async function AdminDashboard() {
  // Parallel Data Fetching for Performance
  const [
    totalStudents,
    activeEnrollments,
    todaysAttendance,
    overdueFees
  ] = await Promise.all([
    prisma.student.count(),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.attendance.count({ 
      where: { 
        date: { gte: new Date(new Date().setHours(0,0,0,0)) } 
      }
    }),
    prisma.fee.aggregate({
      where: { status: 'UNPAID', dueDate: { lt: new Date() } },
      _sum: { amount: true }
    })
  ])

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={totalStudents} icon="👥" />
        <StatCard title="Active Enrollments" value={activeEnrollments} icon="📚" />
        <StatCard title="Present Today" value={todaysAttendance} icon="✅" />
        <StatCard title="Overdue Fees" value={`$${overdueFees._sum.amount || 0}`} icon="⚠️" isAlert />
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/enrollment/new"
            className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="p-3 bg-blue-500 text-white rounded-lg group-hover:bg-blue-600 transition-colors">
              <GraduationCap size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">New Enrollment</h4>
              <p className="text-sm text-gray-600">Enroll students in courses</p>
            </div>
          </Link>

          <Link
            href="/admin/students/new"
            className="flex items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <div className="p-3 bg-green-500 text-white rounded-lg group-hover:bg-green-600 transition-colors">
              <UserPlus size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">New Admission</h4>
              <p className="text-sm text-gray-600">Add new students</p>
            </div>
          </Link>

          <Link
            href="/admin/fees"
            className="flex items-center gap-4 p-6 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <div className="p-3 bg-purple-500 text-white rounded-lg group-hover:bg-purple-600 transition-colors">
              <DollarSign size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Collect Fees</h4>
              <p className="text-sm text-gray-600">Manage fee collection</p>
            </div>
          </Link>

          <Link
            href="/admin/schedule"
            className="flex items-center gap-4 p-6 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors group"
          >
            <div className="p-3 bg-orange-500 text-white rounded-lg group-hover:bg-orange-600 transition-colors">
              <Calendar size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Course Schedule</h4>
              <p className="text-sm text-gray-600">View timetables & capacity</p>
            </div>
          </Link>

          <Link
            href="/admin/students"
            className="flex items-center gap-4 p-6 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors group"
          >
            <div className="p-3 bg-indigo-500 text-white rounded-lg group-hover:bg-indigo-600 transition-colors">
              <Users size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Manage Students</h4>
              <p className="text-sm text-gray-600">View all students</p>
            </div>
          </Link>

          <Link
            href="/admin/fees/reports"
            className="flex items-center gap-4 p-6 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
          >
            <div className="p-3 bg-red-500 text-white rounded-lg group-hover:bg-red-600 transition-colors">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Reports</h4>
              <p className="text-sm text-gray-600">Generate fee reports</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, isAlert }: any) {
  return (
    <div className={`p-6 rounded-xl border shadow-sm bg-white ${isAlert ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${isAlert ? 'text-red-600' : ''}`}>
        {value}
      </div>
    </div>
  )
}