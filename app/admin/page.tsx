// app/admin/page.tsx
import prisma from '@/lib/prisma'
import { Card } from '@/components/ui/card' // Assuming you have shadcn cards, or use div

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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="font-bold mb-4">Recent Activity</h3>
            <p className="text-gray-500 text-sm">System logs will appear here...</p>
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