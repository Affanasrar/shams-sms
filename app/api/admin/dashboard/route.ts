// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminApiRole } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  // ✅ ROLE VERIFICATION: Verify admin access
  const { isAdmin } = await verifyAdminApiRole()
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }
  try {
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

    // Recent activities: query AuditLog first, fallback to transactions/enrollments
    const auditLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' }
    })

    let recentActivities = []

    if (auditLogs.length > 0) {
      recentActivities = auditLogs.map(log => {
        const details = (log.details as Record<string, any>) || {}
        let type: 'fee' | 'drop' | 'enrollment' = 'enrollment'
        let message = ''

        if (log.action.startsWith('FEE')) {
          type = 'fee'
          message = details.studentName
            ? `${details.studentName} paid PKR ${Number(details.amountPaid || 0).toLocaleString('en-PK')}`
            : `Fee collection recorded`
        } else if (log.action === 'ENROLLMENT_DROPPED') {
          type = 'drop'
          message = details.studentName
            ? `${details.studentName} dropped from ${details.courseName || 'course'}`
            : `Student enrollment dropped`
        } else if (log.action === 'ENROLLMENT_COMPLETED') {
          type = 'fee'
          message = details.studentName
            ? `${details.studentName} completed ${details.courseName || 'course'}`
            : `Course completion recorded`
        } else if (log.action === 'ENROLLMENT_EXTENDED') {
          type = 'enrollment'
          message = details.studentName
            ? `${details.studentName}'s enrollment extended by ${details.additionalMonths || 1} month(s)`
            : `Course extension recorded`
        } else if (log.action === 'ENROLLMENT_CREATED') {
          type = 'enrollment'
          message = details.studentName
            ? `${details.studentName} enrolled in ${details.courseName || 'course'}`
            : `New enrollment created`
        } else {
          message = `${log.action.replace(/_/g, ' ')} on ${log.entity}`
        }

        const date = new Date(log.createdAt)
        const now = new Date()
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
        let timeAgo = `${diffMinutes}m ago`
        if (diffMinutes < 1) timeAgo = 'Just now'
        else if (diffMinutes >= 60 && diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)}h ago`
        else if (diffMinutes >= 1440) timeAgo = `${Math.floor(diffMinutes / 1440)}d ago`

        return {
          id: log.id,
          type,
          message,
          timestamp: log.createdAt,
          time: timeAgo
        }
      })
    } else {
      const recentEnrollments = await prisma.enrollment.findMany({
        take: 5,
        orderBy: { joiningDate: 'desc' },
        include: { student: true, courseOnSlot: { include: { course: true } } }
      })

      const recentDrops = await prisma.enrollment.findMany({
        take: 5,
        where: { status: 'DROPPED' },
        orderBy: { endDate: 'desc' },
        include: { student: true, courseOnSlot: { include: { course: true } } }
      })

      const recentTransactions = await prisma.transaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { fee: { include: { student: true } } }
      })

      const combined = [
        ...recentEnrollments.map(e => ({
          id: e.id,
          type: 'enrollment' as const,
          message: `${e.student.name} enrolled in ${e.courseOnSlot.course.name}`,
          timestamp: e.joiningDate,
          time: new Date(e.joiningDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
        })),
        ...recentDrops.map(e => ({
          id: `drop-${e.id}`,
          type: 'drop' as const,
          message: `${e.student.name} dropped from ${e.courseOnSlot.course.name}`,
          timestamp: e.endDate || new Date(),
          time: new Date(e.endDate || new Date()).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
        })),
        ...recentTransactions.map(t => ({
          id: t.id,
          type: 'fee' as const,
          message: `${t.fee.student.name} paid PKR ${Number(t.amount).toLocaleString('en-PK')} towards fees`,
          timestamp: t.date,
          time: new Date(t.date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)

      recentActivities = combined
    }

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

    return NextResponse.json({
      totalStudents,
      activeEnrollments,
      todaysAttendance,
      overdueFees,
      overdueAmount,
      pendingFees,
      pendingAmount,
      recentActivities,
      feeTrendData
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}