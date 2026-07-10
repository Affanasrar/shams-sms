// app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, AlertTriangle, TrendingUp, Calendar, Sparkles, ShieldCheck, BadgeCheck } from 'lucide-react'
import { MetricCard } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

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
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // CLIENT-SIDE VERIFICATION: Additional layer of protection
  // Note: Server-side check in layout is primary protection
  useEffect(() => {
    if (!isLoaded) return

    if (!userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])

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
      <div className="space-y-6">
        <div className="premium-panel p-8">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="mt-2 text-slate-600">Loading your latest insights…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="premium-panel overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">Admin control center</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Welcome back, your school is performing beautifully.</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">A refined view of attendance, payments, enrollments, and live activity across your institution.</p>
          </div>
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            Export summary
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Students" value={data.totalStudents ?? 'N/A'} icon={Users} iconColor="text-indigo-600" />
        <MetricCard title="Active Enrollments" value={data.activeEnrollments ?? 'N/A'} icon={Calendar} iconColor="text-emerald-600" />
        <MetricCard title="Present Today" value={data.todaysAttendance ?? 'N/A'} icon={TrendingUp} iconColor="text-sky-600" />
        <MetricCard title="Pending Fees" value={`${data.pendingFees ?? 0} • PKR ${Number(data.pendingAmount || 0).toLocaleString('en-PK')}`} icon={AlertTriangle} iconColor="text-amber-600" valueColor="text-amber-600" />
        <MetricCard title="Overdue Fees" value={`${data.overdueFees ?? 0} • PKR ${Number(data.overdueAmount || 0).toLocaleString('en-PK')}`} icon={AlertTriangle} iconColor="text-rose-600" valueColor="text-rose-600" />
      </div>

      <div className="premium-panel p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Operational snapshot</h2>
            <p className="text-sm text-slate-500">A polished view of what matters most for today.</p>
          </div>
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">Live insight</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold">Enrollment momentum</p>
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{data.activeEnrollments ?? 0}</p>
            <p className="mt-2 text-sm text-slate-500">Active enrollments across current sessions</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="font-semibold">Attendance readiness</p>
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{data.todaysAttendance ?? 0}</p>
            <p className="mt-2 text-sm text-slate-500">Students marked present for today</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-700">
              <BadgeCheck className="h-5 w-5 text-amber-600" />
              <p className="font-semibold">Financial attention</p>
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-950">PKR {Number(data.pendingAmount || 0).toLocaleString('en-PK')}</p>
            <p className="mt-2 text-sm text-slate-500">{data.pendingFees ?? 0} pending fees awaiting follow-up</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="premium-panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Live activity feed</h2>
              <p className="text-sm text-slate-500">Recent updates from your operations.</p>
            </div>
          </div>
          <div className="space-y-4">
            {data.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${activity.type === 'fee' ? 'bg-emerald-500' : activity.type === 'drop' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="mt-6 w-full" asChild>
            <Link href="/admin/activities">View all activities</Link>
          </Button>
        </div>

        <div className="premium-panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/admin/students/new">+ New student</Link></Button>
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/admin/enrollment/new">+ New enrollment</Link></Button>
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/admin/fees/dashboard">Collect fees</Link></Button>
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/admin/attendance">Mark attendance</Link></Button>
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/admin/fees/reports">View reports</Link></Button>
          </div>
        </div>
      </div>
    </div>
  )
}