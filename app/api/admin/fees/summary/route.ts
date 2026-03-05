// app/api/admin/fees/summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get current month and year for default view
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-based
    const currentYear = now.getFullYear()

    // Fetch summary data
    const [
      totalStudents,
      totalFeesThisMonth,
      paidFeesThisMonth,
      pendingFeesThisMonth,
      courses
    ] = await Promise.all([
      prisma.student.count(),
      prisma.fee.aggregate({
        where: {
          cycleDate: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1)
          }
        },
        _sum: { finalAmount: true }
      }),
      prisma.fee.aggregate({
        where: {
          cycleDate: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1)
          },
          status: { in: ['PAID', 'PARTIAL'] }
        },
        _sum: { paidAmount: true }
      }),
      prisma.fee.aggregate({
        where: {
          cycleDate: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1)
          },
          status: { in: ['UNPAID', 'PARTIAL'] }
        },
        _sum: {
          finalAmount: true,
          paidAmount: true
        }
      }),
      prisma.course.findMany({
        select: { id: true, name: true }
      })
    ])

    const pendingAmount = Number(totalFeesThisMonth._sum.finalAmount || 0) -
                         Number(paidFeesThisMonth._sum.paidAmount || 0)

    // Get overdue fees count (30+ days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const overdueFeesCount = await prisma.fee.count({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lt: thirtyDaysAgo }
      }
    })

    // Get students with pending fees
    const studentsWithPendingFees = await prisma.fee.findMany({
      where: {
        cycleDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1)
        },
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      distinct: ['studentId'],
      select: { studentId: true }
    })

    const collectionRate = totalFeesThisMonth._sum.finalAmount ?
      ((Number(paidFeesThisMonth._sum.paidAmount || 0) / Number(totalFeesThisMonth._sum.finalAmount)) * 100) : 0

    return NextResponse.json({
      totalStudents,
      totalFeesThisMonth: Number(totalFeesThisMonth._sum.finalAmount || 0),
      paidFeesThisMonth: Number(paidFeesThisMonth._sum.paidAmount || 0),
      pendingAmount,
      overdueFeesCount,
      studentsWithPendingFeesCount: studentsWithPendingFees.length,
      collectionRate,
      courses
    })
  } catch (error) {
    console.error('Error fetching fees summary:', error)
    return NextResponse.json({ error: 'Failed to fetch fees summary' }, { status: 500 })
  }
}