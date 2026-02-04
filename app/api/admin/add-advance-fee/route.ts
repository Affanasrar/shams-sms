// app/api/admin/add-advance-fee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { enrollmentId, amount, adminId, courseOnSlotId } = await request.json()

    if (!enrollmentId || !amount || !adminId || !courseOnSlotId) {
      return NextResponse.json(
        { error: 'Missing required fields: enrollmentId, amount, adminId, courseOnSlotId' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true, courseOnSlot: { include: { course: true } } }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Get the course info for fee calculation
    const courseOnSlot = await prisma.courseOnSlot.findUnique({
      where: { id: courseOnSlotId },
      include: { course: true }
    })

    if (!courseOnSlot) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Create advance fee record
    // Set due date to tomorrow or next appropriate date
    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 1)

    // Set cycle date to current month
    const cycleDate = new Date(today.getFullYear(), today.getMonth(), 1)

    // ⭐ CRITICAL: Check if fee already exists for this enrollment and cycle
    // Prevent duplicate advance fees from being created multiple times
    const existingAdvanceFee = await prisma.fee.findFirst({
      where: {
        enrollmentId: enrollmentId,
        cycleDate: {
          gte: cycleDate,
          lt: new Date(cycleDate.getTime() + 86400000) // cycleDate + 1 day
        }
      }
    })

    if (existingAdvanceFee) {
      return NextResponse.json(
        { error: `Fee already exists for this student in ${cycleDate.toISOString().split('T')[0]}. Total fees for this month: PKR ${Number(existingAdvanceFee.finalAmount)}` },
        { status: 400 }
      )
    }

    const newFee = await prisma.fee.create({
      data: {
        studentId: enrollment.studentId,
        enrollmentId: enrollmentId,
        amount: amount,
        discountAmount: 0,
        finalAmount: amount,
        paidAmount: 0,
        rolloverAmount: 0,
        dueDate: dueDate,
        status: 'UNPAID',
        cycleDate: cycleDate
      }
    })

    return NextResponse.json({
      success: true,
      fee: newFee
    })
  } catch (error) {
    console.error('Add advance fee error:', error)
    return NextResponse.json({ error: 'Failed to add advance fee' }, { status: 500 })
  }
}
