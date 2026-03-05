// app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import { MetricCard } from '@/components/ui'
import { Button } from '@/components/ui/button'
import FeeTrendChart from '@/components/ui/fee-trend-chart'

type DashboardData = {
  totalStudents: number
  activeEnrollments: number
  todaysAttendance: number
  overdueFees: number
  overdueAmount: number
  pendingFees: number
  pendingAmount: number
  recentActivities: Array<{
    id: string
    type: 'enrollment' | 'drop' | 'fee'
    message: string
    timestamp: string
    time: string
  }>
  feeTrendData: Array<{
    month: string
    collected: number
    due: number
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

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
          value={data.totalStudents ?? 'N/A'}
          icon={Users}
          iconColor="text-blue-600"
          valueColor="text-slate-900"
        />
        <MetricCard
          title="Active Enrollments"
          value={data.activeEnrollments ?? 'N/A'}
          icon={Calendar}
          iconColor="text-green-600"
          valueColor="text-slate-900"
        />
        <MetricCard
          title="Present Today"
          value={data.todaysAttendance ?? 'N/A'}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          valueColor="text-slate-900"
        />
        <MetricCard
          title="Pending Fees"
          value={`${data.pendingFees ?? 0} • PKR ${Number(data.pendingAmount || 0).toLocaleString('en-PK')}`}
          icon={AlertTriangle}
          iconColor="text-red-600"
          valueColor="text-red-600"
        />
        <MetricCard
          title="Overdue Fees"
          value={`${data.overdueFees ?? 0} • PKR ${Number(data.overdueAmount || 0).toLocaleString('en-PK')}`}
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
          <FeeTrendChart data={data.feeTrendData} />
        </div>
      </div>

      {/* Bottom Grid: Side Panel with Live Activities */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Recent Activities */}
        <div className="lg:col-span-2 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight mb-6" style={{ color: '#0f172a' }}>Live Activity Feed</h2>
          <div className="space-y-4">
            {data.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'fee'
                    ? 'bg-emerald-500'
                    : activity.type === 'drop'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{activity.message}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-6" asChild>
            <Link href="/admin/activities">View All Activities</Link>
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