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

    // Recent activities: fetch enrollments (new + dropped) and fee transactions
    const recentEnrollments = await prisma.enrollment.findMany({
      take: 10,
      orderBy: { joiningDate: 'desc' },
      include: { student: true, courseOnSlot: { include: { course: true } } }
    })

    // also grab most recent drops (status DROPPED) by endDate
    const recentDrops = await prisma.enrollment.findMany({
      take: 10,
      where: { status: 'DROPPED' },
      orderBy: { endDate: 'desc' },
      include: { student: true, courseOnSlot: { include: { course: true } } }
    })

    // Fetch recent fee transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        fee: {
          include: { student: true }
        },
        collectedBy: true
      }
    })

    // Combine and sort all activities by timestamp
    const allActivities = [
      ...recentEnrollments.map(e => ({
        id: e.id,
        type: 'enrollment' as const,
        message: `${e.student.name} enrolled in ${e.courseOnSlot.course.name}`,
        timestamp: e.joiningDate,
        time: e.joiningDate.toLocaleString('en-PK')
      })),
      ...recentDrops.map(e => ({
        id: `drop-${e.id}`,
        type: 'drop' as const,
        message: `${e.student.name} dropped from ${e.courseOnSlot.course.name}`,
        timestamp: e.endDate || new Date(),
        time: (e.endDate || new Date()).toLocaleString('en-PK')
      })),
      ...recentTransactions.map(t => ({
        id: t.id,
        type: 'fee' as const,
        message: `${t.fee.student.name} paid PKR ${Number(t.amount).toLocaleString('en-PK')} towards fees`,
        timestamp: t.date,
        time: t.date.toLocaleString('en-PK')
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8)

    const recentActivities = allActivities

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