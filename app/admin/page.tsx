// app/admin/page.tsx
"use client"

import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Users, AlertTriangle, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { MetricCard } from '@/components/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { use, useEffect, useState } from 'react'

// Fee trend data (mock - replace with real data)
const feeTrendData = [
  { month: 'Jan', collected: 45000, due: 52000 },
  { month: 'Feb', collected: 52000, due: 55000 },
  { month: 'Mar', collected: 48000, due: 60000 },
  { month: 'Apr', collected: 61000, due: 58000 },
  { month: 'May', collected: 55000, due: 65000 },
  { month: 'Jun', collected: 67000, due: 70000 },
]

const recentActivities = [
  { id: 1, type: 'attendance', message: 'Ahmed Khan marked as present', time: '2 mins ago' },
  { id: 2, type: 'fee', message: 'PKR 5,000 collected from Fatima Ali', time: '5 mins ago' },
  { id: 3, type: 'enrollment', message: 'New enrollment: Computer Science 2401', time: '12 mins ago' },
  { id: 4, type: 'fee', message: 'Fee reminder sent to 45 students', time: '1 hour ago' },
]

export default async function AdminDashboard() {
  let dashboardData = {
    totalStudents: 0,
    activeEnrollments: 0,
    todaysAttendance: 0,
    overdueFees: 0,
  }

  try {
    // Parallel Data Fetching for Performance
    const [
      totalStudents,
      activeEnrollments,
      todaysAttendance,
      overdueFees
    ] = await Promise.all([
      (async () => {
        const count = await prisma.student.count()
        return count
      })(),
      (async () => {
        const count = await prisma.enrollment.count({ where: { status: 'ACTIVE' } })
        return count
      })(),
      (async () => {
        const count = await prisma.attendance.count({ 
          where: { 
            date: { gte: new Date(new Date().setHours(0,0,0,0)) },
            status: 'PRESENT'
          }
        })
        return count
      })(),
      (async () => {
        const fees = await prisma.fee.findMany({
          where: { 
            status: { in: ['UNPAID', 'PARTIAL'] }, 
            dueDate: { lt: new Date() } 
          },
          select: { finalAmount: true, paidAmount: true }
        })
        return fees.reduce((sum, fee) => sum + Number(fee.finalAmount) - Number(fee.paidAmount), 0)
      })(),
    ])

    dashboardData = {
      totalStudents,
      activeEnrollments,
      todaysAttendance,
      overdueFees,
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome back to your school management system</p>
      </div>

      {/* Top Row: High-Level Metrics in Bento Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={dashboardData.totalStudents}
          icon={Users}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Active Enrollments"
          value={dashboardData.activeEnrollments}
          icon={Calendar}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Present Today"
          value={dashboardData.todaysAttendance}
          icon={TrendingUp}
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Overdue Fees"
          value={`PKR ${Number(dashboardData.overdueFees || 0).toLocaleString()}`}
          icon={AlertTriangle}
          iconColor="text-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* Center Panel: Fee Collection Trends Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Fee Collection Trends</h2>
            <p className="text-sm text-muted-foreground">6-month collection analysis</p>
          </div>
          <Button variant="outline" size="sm">Export</Button>
        </div>
        
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={feeTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="collected" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                dot={false}
                name="Collected"
              />
              <Line 
                type="monotone" 
                dataKey="due" 
                stroke="var(--color-muted-foreground)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Due"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bottom Grid: Side Panel with Live Activities */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold tracking-tight mb-6">Live Activity Feed</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'fee' ? 'bg-emerald-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" className="w-full mt-6" asChild>
            <Link href="/admin/students">View All Activities</Link>
          </Button>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold tracking-tight mb-6">Quick Actions</h2>
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
        </Card>
      </div>
    </div>
  )
}