// app/api/admin/fees/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const courseId = searchParams.get('courseId') || ''
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Determine date range
    let startDate, endDate
    
    if (startDateParam && endDateParam) {
      // Use custom date range
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
      endDate.setDate(endDate.getDate() + 1) // Include the end date
    } else {
      // Use month/year
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 1)
    }

    // Build where clause
    const whereClause: any = {
      dueDate: {
        gte: startDate,
        lt: endDate
      }
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status
    }

    if (courseId) {
      whereClause.enrollment = {
        courseOnSlot: {
          courseId: courseId
        }
      }
    }

    // Fetch fees with related data
    const fees = await prisma.fee.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            fatherName: true
          }
        },
        enrollment: {
          include: {
            courseOnSlot: {
              include: {
                course: true
              }
            }
          }
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true }
        }
      },
      orderBy: [
        { student: { name: 'asc' } }
      ]
    })

    // Process and group fees by student
    const studentFeesMap = new Map()

    fees.forEach(fee => {
      const studentId = fee.student.studentId
      const key = `${studentId}-${fee.enrollment?.courseOnSlot.course.name || 'General'}`

      if (!studentFeesMap.has(key)) {
        studentFeesMap.set(key, {
          studentId: fee.student.studentId,
          studentName: fee.student.name,
          fatherName: fee.student.fatherName,
          courseName: fee.enrollment?.courseOnSlot.course.name || 'General Fee',
          month: new Date(startDate).toLocaleString('default', { month: 'long' }),
          year: year,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          status: 'UNPAID',
          lastPayment: null as string | null
        })
      }

      const studentFee = studentFeesMap.get(key)
      studentFee.totalAmount += Number(fee.finalAmount)
      studentFee.paidAmount += Number(fee.paidAmount)
      studentFee.pendingAmount += Number(fee.finalAmount) - Number(fee.paidAmount)

      // Determine status
      if (studentFee.pendingAmount === 0) {
        studentFee.status = 'PAID'
      } else if (studentFee.paidAmount > 0) {
        studentFee.status = 'PARTIAL'
      }

      // Set last payment date
      if (fee.transactions.length > 0 && (!studentFee.lastPayment || new Date(fee.transactions[0].date) > new Date(studentFee.lastPayment))) {
        studentFee.lastPayment = fee.transactions[0].date.toISOString().split('T')[0]
      }
    })

    // Filter by search term if provided
    let result = Array.from(studentFeesMap.values())
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(fee =>
        fee.studentName.toLowerCase().includes(searchLower) ||
        fee.studentId.toLowerCase().includes(searchLower) ||
        fee.fatherName.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching fees dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}