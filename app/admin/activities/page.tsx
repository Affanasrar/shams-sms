// app/admin/activities/page.tsx
import prisma from '@/lib/prisma'
import ActivitiesClient from './activities-client'

export default async function ActivitiesPage() {
  // Fetch all audit logs across the whole database
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Format details safely
  const formatAuditMessage = (log: any): string => {
    const details = (log.details as Record<string, any>) || {}
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

  const mapLogType = (action: string) => {
    if (action.startsWith('ENROLLMENT')) return 'enrollment'
    if (action.startsWith('FEE')) return 'fee'
    if (action.startsWith('EXPENSE')) return 'expense'
    if (action === 'ENROLLMENT_DROPPED') return 'drop'
    return 'system'
  }

  const allActivities = auditLogs.map((log: any) => ({
    id: log.id,
    type: mapLogType(log.action),
    message: formatAuditMessage(log),
    timestamp: log.createdAt.toISOString(),
    time: log.createdAt.toLocaleString('en-PK'),
    action: log.action,
    userName: log.userName
  }))

  return <ActivitiesClient initialActivities={JSON.parse(JSON.stringify(allActivities))} />
}
