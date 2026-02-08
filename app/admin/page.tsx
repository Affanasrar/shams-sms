// app/admin/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Users, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import { MetricCard } from '@/components/ui'
import { Button } from '@/components/ui/button'
import FeeTrendChart from '@/components/ui/fee-trend-chart'

// Server component: fetch real metrics and pass serialized data to client chart
export default async function AdminDashboard() {
  // High level metrics
  const [totalStudents, activeEnrollments] = await Promise.all([
    prisma.student.count(),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
  ])

  // Today's attendance (present)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  // Count distinct students marked PRESENT today
  const todaysAttendanceRows = await prisma.attendance.findMany({
    where: {
      date: {
        gte: todayStart,
        lte: todayEnd
      },
      status: 'PRESENT'
    },
    select: { studentId: true }
  })
  const todaysAttendance = Array.from(new Set(todaysAttendanceRows.map(r => r.studentId))).length

  // Overdue fees (older than 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const overdueFees = await prisma.fee.count({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      dueDate: { lt: thirtyDaysAgo }
    }
  })
  // Also compute overdue amount (sum of outstanding amounts)
  const overdueSums = await prisma.fee.aggregate({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      dueDate: { lt: thirtyDaysAgo }
    },
    _sum: {
      finalAmount: true,
      paidAmount: true
    }
  })
  const overdueAmount = Number((overdueSums._sum.finalAmount || 0)) - Number((overdueSums._sum.paidAmount || 0))

  // Pending fees (all UNPAID or PARTIAL, regardless of due date)
  const pendingFees = await prisma.fee.count({
    where: { status: { in: ['UNPAID', 'PARTIAL'] } }
  })
  const pendingSums = await prisma.fee.aggregate({
    where: { status: { in: ['UNPAID', 'PARTIAL'] } },
    _sum: { finalAmount: true, paidAmount: true }
  })
  const pendingAmount = Number((pendingSums._sum.finalAmount || 0)) - Number((pendingSums._sum.paidAmount || 0))

  // Recent activities: latest enrollments (as a simple activity feed)
  const recentEnrollments = await prisma.enrollment.findMany({
    take: 6,
    orderBy: { joiningDate: 'desc' },
    include: { student: true, courseOnSlot: { include: { course: true } } }
  })

  const recentActivities = recentEnrollments.map(e => ({
    id: e.id,
    type: 'enrollment',
    message: `${e.student.name} enrolled in ${e.courseOnSlot.course.name}`,
    time: e.joiningDate.toLocaleString('en-PK')
  }))

  // Fee trend: last 6 months
  const now = new Date()
  const months: { month: string; start: Date; end: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    months.push({ month: d.toLocaleString('en', { month: 'short' }), start, end })
  }

  const fees = await prisma.fee.findMany({
    where: { cycleDate: { gte: months[0].start } },
    select: { finalAmount: true, paidAmount: true, cycleDate: true }
  })

  const feeTrendData = months.map(m => {
    const monthFees = fees.filter(f => {
      const d = new Date(f.cycleDate)
      return d >= m.start && d <= m.end
    })
    const collected = monthFees.reduce((s, f) => s + Number(f.paidAmount || 0), 0)
    const due = monthFees.reduce((s, f) => s + Number(f.finalAmount || 0), 0)
    return { month: m.month, collected, due }
  })

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Welcome back! Here's your school's performance at a glance.</p>
      </div>

      {/* Top Row: High-Level Metrics in Bento Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Students"
          value={totalStudents ?? 'N/A'}
          icon={Users}
          iconColor="text-blue-600"
          valueColor="text-slate-900"
        />
        <MetricCard
          title="Active Enrollments"
          value={activeEnrollments ?? 'N/A'}
          icon={Calendar}
          iconColor="text-green-600"
          valueColor="text-slate-900"
        />
        <MetricCard
          title="Present Today"
          value={todaysAttendance ?? 'N/A'}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          valueColor="text-slate-900"
        />
        <MetricCard
          title="Pending Fees"
          value={`${pendingFees ?? 0} • PKR ${Number(pendingAmount || 0).toLocaleString('en-PK')}`}
          icon={AlertTriangle}
          iconColor="text-red-600"
          valueColor="text-red-600"
        />
        <MetricCard
          title="Overdue Fees"
          value={`${overdueFees ?? 0} • PKR ${Number(overdueAmount || 0).toLocaleString('en-PK')}`}
          icon={AlertTriangle}
          iconColor="text-rose-600"
          valueColor="text-rose-600"
        />
      </div>

      {/* Center Panel: Fee Collection Trends Chart */}
      <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Fee Collection Trends</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>6-month collection analysis</p>
          </div>
          <Button variant="outline" size="sm">Export</Button>
        </div>

        <div className="w-full h-80">
          <FeeTrendChart data={feeTrendData} />
        </div>
      </div>

      {/* Bottom Grid: Side Panel with Live Activities */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Recent Activities */}
        <div className="lg:col-span-2 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight mb-6" style={{ color: '#0f172a' }}>Live Activity Feed</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'fee' ? 'bg-emerald-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{activity.message}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-6" asChild>
            <Link href="/admin/students">View All Activities</Link>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight mb-6" style={{ color: '#0f172a' }}>Quick Actions</h2>
          <div className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/students/new">+ New Student</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/enrollment/new">+ New Enrollment</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/fees/dashboard">Collect Fees</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/attendance">Mark Attendance</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/fees/reports">View Reports</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}