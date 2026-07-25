// app/admin/activities/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Users, TrendingUp, DollarSign, Calendar, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Activity = {
  id: string
  type: 'enrollment' | 'fee' | 'drop' | 'expense' | 'system'
  message: string
  timestamp: Date
  time: string
  action: string
  userName?: string | null
}

export default async function ActivitiesPage() {
  // Fetch recent audit logs (last 100 entries)
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  // Helper to format details safely
  const formatAuditMessage = (log: any): string => {
    const details = log.details as Record<string, any> || {}
    switch (log.action) {
      case 'FEE_COLLECTED':
        return `${details.studentName || 'Student'} paid PKR ${Number(details.amountPaid || 0).toLocaleString('en-PK')} (Status: ${details.newStatus || 'PAID'})`
      case 'ENROLLMENT_CREATED':
        return `${details.studentName || 'Student'} enrolled in ${details.courseName || 'Course'}`
      case 'ENROLLMENT_DROPPED':
        return `Student enrollment dropped (Refund: ${details.refund ? 'Yes' : 'No'})`
      case 'ENROLLMENT_COMPLETED':
        return `${details.studentName || 'Student'} marked as COMPLETED for ${details.courseName || 'Course'}`
      case 'ENROLLMENT_EXTENDED':
        return `${details.studentName || 'Student'}'s course (${details.courseName || 'Course'}) extended by ${details.additionalMonths || 1} month(s)`
      case 'EXPENSE_CREATED':
        return `Expense added: "${details.title || 'Expense'}" — PKR ${Number(details.amount || 0).toLocaleString('en-PK')} (${details.category || 'OTHER'})`
      case 'EXPENSE_DELETED':
        return `Expense deleted: "${details.title || 'Expense'}" — PKR ${Number(details.amount || 0).toLocaleString('en-PK')}`
      default:
        return `${log.action} performed on ${log.entity} (${log.entityId})`
    }
  }

  const mapLogType = (action: string): Activity['type'] => {
    if (action.startsWith('ENROLLMENT')) return 'enrollment'
    if (action.startsWith('FEE')) return 'fee'
    if (action.startsWith('EXPENSE')) return 'expense'
    if (action === 'ENROLLMENT_DROPPED') return 'drop'
    return 'system'
  }

  const allActivities: Activity[] = auditLogs.map((log: any) => ({
    id: log.id,
    type: mapLogType(log.action),
    message: formatAuditMessage(log),
    timestamp: log.createdAt,
    time: log.createdAt.toLocaleString('en-PK'),
    action: log.action,
    userName: log.userName
  }))

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin"><ArrowLeft size={16} /> Back</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={28} />
            Audit Trails & Activity Logs
          </h1>
          <p className="text-slate-600">Comprehensive view of all logged actions and system state modifications</p>
        </div>
      </div>

      {/* Activities grouped by day */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Activity History</h2>
          <span className="text-xs text-gray-500">Showing last 100 records</span>
        </div>

        <div className="divide-y">
          {sortedDays.map(([dayKey, activities]) => {
            const dayDate = new Date(dayKey)

            return (
              <div key={dayKey} className="p-6">
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <h3 className="font-semibold text-gray-900">
                    {dayDate.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </h3>
                </div>

                {/* Activities List */}
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                        activity.type === 'fee' ? 'bg-emerald-500' :
                        activity.type === 'drop' ? 'bg-red-500' :
                        activity.type === 'expense' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString('en-PK', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {activity.userName && ` • By: ${activity.userName}`}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                        activity.type === 'fee' ? 'bg-emerald-100 text-emerald-700' :
                        activity.type === 'drop' ? 'bg-red-100 text-red-700' :
                        activity.type === 'expense' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.action.replace('_', ' ')}
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
            <p>No audit logs recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
