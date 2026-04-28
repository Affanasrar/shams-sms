// app/api/admin/sms/send/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTextbeeSms } from '@/lib/textbee'

export async function POST(request: Request) {
  try {
    const { studentIds, customMessage, courseId } = await request.json()

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one student must be selected' },
        { status: 400 }
      )
    }

    // Fetch selected students with their enrollments and fees
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds }
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            courseOnSlot: {
              include: {
                course: true
              }
            },
            fees: {
              where: {
                status: { in: ['UNPAID', 'PARTIAL'] }
              },
              orderBy: {
                dueDate: 'desc'
              }
            }
          }
        }
      }
    })

    const results = []

    for (const student of students) {
      try {
        let message = ''

        if (customMessage) {
          // Use custom message with placeholder replacement
          message = customMessage
            .replace(/\[Student Name\]/g, student.name)
            .replace(/\[Student ID\]/g, student.studentId)
        } else {
          // Generate due-date reminder message
          const allFees = student.enrollments.flatMap(enrollment => enrollment.fees)
          const recentFee = allFees.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0]
          const totalOutstanding = allFees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)

          if (!recentFee) {
            results.push({
              studentId: student.id,
              success: false,
              message: 'No unpaid fees found'
            })
            continue
          }

          const monthName = recentFee.dueDate.toLocaleString('en-US', { month: 'long' })
          const year = recentFee.dueDate.getFullYear()
          const dueDateStr = recentFee.dueDate.toISOString().split('T')[0]
          const amount = Number(recentFee.finalAmount)

          message = `Dear ${student.name}, your fee for ${monthName} ${year} is due on ${dueDateStr}. Amount: PKR ${amount}. Student ID: ${student.studentId}. Please pay promptly to avoid late fees. - Shams Commercial Institute`
        }

        if (!student.phone) {
          results.push({
            studentId: student.id,
            success: false,
            message: 'No phone number available'
          })
          continue
        }

        const smsSent = await sendTextbeeSms(student.phone, message)

        results.push({
          studentId: student.id,
          success: smsSent,
          message: smsSent ? 'SMS sent successfully' : 'Failed to send SMS'
        })

      } catch (error) {
        console.error(`Error sending SMS to ${student.name}:`, error)
        results.push({
          studentId: student.id,
          success: false,
          message: 'Error occurred while sending SMS'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('SMS send API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}