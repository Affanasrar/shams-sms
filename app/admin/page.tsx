// app/admin/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Users, GraduationCap, CheckCircle, AlertTriangle, UserPlus, DollarSign, Calendar, FileText } from 'lucide-react'
import { PageHeader, MetricCard, ActionCard, PageLayout } from '@/components/ui'

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
    <PageLayout>
      <PageHeader
        title="Dashboard Overview"
        description="Comprehensive school management and monitoring"
        actions={
          <>
            <Link
              href="/admin/enrollment/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <GraduationCap size={16} />
              New Enrollment
            </Link>
            <Link
              href="/admin/students/new"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <UserPlus size={16} />
              New Admission
            </Link>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Active Enrollments"
          value={activeEnrollments}
          icon={GraduationCap}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Present Today"
          value={todaysAttendance}
          icon={CheckCircle}
          iconColor="text-green-600"
          valueColor="text-green-600"
        />
        <MetricCard
          title="Overdue Fees"
          value={`$${Number(overdueFees._sum.amount || 0)}`}
          icon={AlertTriangle}
          iconColor="text-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="New Enrollment"
            description="Enroll students in courses"
            icon={GraduationCap}
            href="/admin/enrollment/new"
            colorScheme="blue"
          />
          <ActionCard
            title="New Admission"
            description="Add new students"
            icon={UserPlus}
            href="/admin/students/new"
            colorScheme="green"
          />
          <ActionCard
            title="Collect Fees"
            description="Manage fee collection"
            icon={DollarSign}
            href="/admin/fees"
            colorScheme="purple"
          />
          <ActionCard
            title="Course Schedule"
            description="View timetables & capacity"
            icon={Calendar}
            href="/admin/schedule"
            colorScheme="orange"
          />
          <ActionCard
            title="Manage Students"
            description="View all students"
            icon={Users}
            href="/admin/students"
            colorScheme="indigo"
          />
          <ActionCard
            title="Reports"
            description="Generate fee reports"
            icon={FileText}
            href="/admin/fees/reports"
            colorScheme="red"
          />
        </div>
      </div>
    </PageLayout>
  )
}