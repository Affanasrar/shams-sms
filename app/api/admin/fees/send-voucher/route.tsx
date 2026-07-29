// app/api/admin/fees/send-voucher/route.tsx
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateFeeVoucherPdfBuffer } from '@/lib/pdf-helpers'
import { sendSmartDocument } from '@/lib/messaging'
import { verifyAdminApiRole } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminApiRole()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { feeId } = body

    if (!feeId) {
      return NextResponse.json({ success: false, error: 'Fee ID is required' }, { status: 400 })
    }

    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: {
        student: true,
        enrollment: {
          include: {
            courseOnSlot: {
              include: {
                course: true,
                slot: { include: { room: true } }
              }
            }
          }
        }
      }
    })

    if (!fee) {
      return NextResponse.json({ success: false, error: 'Fee record not found' }, { status: 404 })
    }

    if (!fee.student.phone) {
      return NextResponse.json({ success: false, error: 'Student has no phone number on record' }, { status: 400 })
    }

    const cycleMonth = new Date(fee.cycleDate).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Karachi',
    })

    const issueDateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Karachi',
    })

    const dueDateStr = new Date(fee.dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Karachi',
    })

    const courseName = fee.enrollment?.courseOnSlot.course.name || 'Course Fee'
    const slot = fee.enrollment?.courseOnSlot.slot
    const formatTime = (d: Date) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
    const timingStr = slot ? `${slot.days} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})` : 'Scheduled Timing'
    const roomName = slot?.room?.name || 'Classroom'

    const remainingAmount = Number(fee.finalAmount) - Number(fee.paidAmount)

    const pdfBuffer = await generateFeeVoucherPdfBuffer({
      voucherNo: `VCH-${fee.id.slice(0, 8).toUpperCase()}`,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      cycleMonth: cycleMonth,
      student: {
        studentId: fee.student.studentId,
        name: fee.student.name,
        fatherName: fee.student.fatherName,
        phone: fee.student.phone,
      },
      course: {
        name: courseName,
        timing: timingStr,
        room: roomName,
      },
      financials: {
        baseAmount: Number(fee.amount),
        discountAmount: Number(fee.discountAmount || 0),
        rolloverAmount: Number(fee.rolloverAmount || 0),
        finalAmount: Number(fee.finalAmount),
        paidAmount: Number(fee.paidAmount),
        remainingAmount: remainingAmount,
      },
      institution: {
        name: 'Shams Commercial Institute',
        address: 'Main Campus, Commercial Area',
        phone: '+92 300 1234567',
      },
    })
    const fileName = `Fee_Voucher_${fee.student.studentId}_${cycleMonth.replace(/\s+/g, '_')}.pdf`
    const caption = `Dear ${fee.student.name}, please find attached your official Fee Voucher for ${cycleMonth}. Net Balance Due: PKR ${remainingAmount.toLocaleString()}. Due Date: ${dueDateStr}. Please pay promptly to avoid penalties. - Shams Commercial Institute`

    const dispatchResult = await sendSmartDocument(fee.student.phone, pdfBuffer, fileName, caption)

    // Audit record
    await prisma.smsMessage.create({
      data: {
        studentId: fee.student.id,
        phoneNumber: fee.student.phone,
        message: `[PDF Voucher] ${caption}`,
        direction: 'OUTBOUND',
        status: dispatchResult.success ? 'SENT' : 'FAILED',
        textbeeId: dispatchResult.id || null,
        errorMsg: dispatchResult.error || null,
        sentAt: dispatchResult.success ? new Date() : null,
      }
    })

    return NextResponse.json({
      success: dispatchResult.success,
      channelUsed: dispatchResult.channelUsed,
      error: dispatchResult.error,
    })
  } catch (error) {
    console.error('Send Voucher Error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
