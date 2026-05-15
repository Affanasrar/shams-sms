// app/admin/activities/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Users, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Activity = {
  id: string
  type: 'enrollment' | 'fee' | 'drop'
  message: string
  timestamp: Date
  time: string
}

export default async function ActivitiesPage() {
  // Fetch all recent activities (last 2 months)
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  const enrollments = await prisma.enrollment.findMany({
    where: {
      joiningDate: { gte: twoMonthsAgo }
    },
    orderBy: { joiningDate: 'desc' },
    include: { student: true, courseOnSlot: { include: { course: true } } }
  })

  const droppedEnrollments = await prisma.enrollment.findMany({
    where: {
      status: 'DROPPED',
      endDate: { gte: twoMonthsAgo }
    },
    orderBy: { endDate: 'desc' },
    include: { student: true, courseOnSlot: { include: { course: true } } }
  })

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: twoMonthsAgo }
    },
    orderBy: { date: 'desc' },
    include: {
      fee: { include: { student: true } },
      collectedBy: true
    }
  })

  // Combine all activities
  const allActivities: Activity[] = [
    ...enrollments.map(e => ({
      id: e.id,
      type: 'enrollment' as const,
      message: `${e.student.name} enrolled in ${e.courseOnSlot.course.name}`,
      timestamp: e.joiningDate,
      time: e.joiningDate.toLocaleString('en-PK')
    })),
    ...droppedEnrollments.map(e => ({
      id: `drop-${e.id}`,
      type: 'drop' as const,
      message: `${e.student.name} dropped from ${e.courseOnSlot.course.name}`,
      timestamp: e.endDate || new Date(),
      time: (e.endDate || new Date()).toLocaleString('en-PK')
    })),
    ...transactions.map(t => ({
      id: t.id,
      type: 'fee' as const,
      message: `${t.fee.student.name} paid PKR ${Number(t.amount).toLocaleString('en-PK')}`,
      timestamp: t.date,
      time: t.date.toLocaleString('en-PK')
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Group activities by day
  const groupedByDay: { [key: string]: Activity[] } = {}

  allActivities.forEach(activity => {
    const date = activity.timestamp
    const key = date.toISOString().slice(0, 10)

    if (!groupedByDay[key]) {
      groupedByDay[key] = []
    }
    groupedByDay[key].push(activity)
  })

  // Sort days in descending order
  const sortedDays = Object.entries(groupedByDay).sort(([a], [b]) => b.localeCompare(a))

  // Calculate summary stats
  const totalEnrollments = enrollments.length
  const totalFeesCollected = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const uniqueStudentsEnrolled = new Set(enrollments.map(e => e.studentId)).size
  const uniqueStudentsPaid = new Set(transactions.map(t => t.fee.studentId)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin"><ArrowLeft size={16} /> Back</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Activities</h1>
          <p className="text-slate-600">Comprehensive view of all system activities</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Fees Collected</p>
              <p className="text-2xl font-bold text-green-600">PKR {totalFeesCollected.toLocaleString('en-PK')}</p>
            </div>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Students Enrolled</p>
              <p className="text-2xl font-bold text-purple-600">{uniqueStudentsEnrolled}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Students Paid</p>
              <p className="text-2xl font-bold text-emerald-600">{uniqueStudentsPaid}</p>
            </div>
            <Calendar className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Activities grouped by day */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Daily Activity Breakdown</h2>
        </div>

        <div className="divide-y">
          {sortedDays.map(([dayKey, activities]) => {
            const dayDate = new Date(dayKey)
            const enrollmentCount = activities.filter(a => a.type === 'enrollment').length
            const dropCount = activities.filter(a => a.type === 'drop').length
            const feeCount = activities.filter(a => a.type === 'fee').length
            const totalFees = activities
              .filter(a => a.type === 'fee')
              .reduce((sum, a) => {
                const match = a.message.match(/PKR ([\d,]+)/)
                return sum + (match ? parseInt(match[1].replace(',', '')) : 0)
              }, 0)

            return (
              <div key={dayKey} className="p-6">
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {dayDate.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </h3>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-gray-600">Enrollments</p>
                      <p className="font-bold text-blue-600">{enrollmentCount}</p>
                    </div>
                    {dropCount > 0 && (
                      <div className="text-right">
                        <p className="text-gray-600">Drops</p>
                        <p className="font-bold text-red-600">{dropCount}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-gray-600">Fee Transactions</p>
                      <p className="font-bold text-green-600">{feeCount}</p>
                    </div>
                    {totalFees > 0 && (
                      <div className="text-right">
                        <p className="text-gray-600">Total Collected</p>
                        <p className="font-bold text-emerald-600">PKR {totalFees.toLocaleString('en-PK')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activities List */}
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        activity.type === 'fee' ? 'bg-emerald-500' : activity.type === 'drop' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(activity.timestamp).toLocaleString('en-PK', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                        activity.type === 'fee' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : activity.type === 'drop'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.type === 'fee' ? 'Fee Payment' : activity.type === 'drop' ? 'Dropped' : 'Enrollment'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {allActivities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No activities recorded in the past 2 months.</p>
          </div>
        )}
      </div>
    </div>
  )
}
