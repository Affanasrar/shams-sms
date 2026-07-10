import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { sendTextbeeSms } from '@/lib/textbee'
import { verifyAdminApiRole } from '@/lib/auth-utils'

// Validation schema for POST request
const SendSmsSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message exceeds 1000 character limit')
    .transform(msg => msg.trim())
    .refine(msg => msg.length > 0, 'Message cannot be only whitespace')
})

/**
 * GET /api/admin/sms/inbox?studentId=<id>
 * - With studentId: Fetch all SMS messages for a student
 * - Without studentId: Fetch all students with SMS conversations (with latest message)
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminApiRole()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const logsOnly = searchParams.get('logs') === 'true'
    const senderData = searchParams.get('senderData') === 'true'

    if (senderData) {
      const students = await prisma.student.findMany({
        where: {
          enrollments: {
            some: {
              status: 'ACTIVE'
            }
          }
        },
        select: {
          id: true,
          studentId: true,
          name: true,
          fatherName: true,
          phone: true,
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
        },
        orderBy: { name: 'asc' }
      })

      const courseSlots = await prisma.courseOnSlot.findMany({
        include: {
          course: true,
          slot: {
            include: {
              room: true
            }
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          course: {
            name: 'asc'
          }
        }
      })

      const serializableStudents = students.map(student => ({
        ...student,
        enrollments: student.enrollments.map(enrollment => ({
          ...enrollment,
          fees: enrollment.fees.map(fee => ({
            ...fee,
            dueDate: fee.dueDate.toISOString(),
            cycleDate: fee.cycleDate?.toISOString() ?? ''
          }))
        }))
      }))

      const serializableCourseSlots = courseSlots.map(slot => ({
        id: slot.id,
        course: {
          id: slot.course.id,
          name: slot.course.name
        },
        slot: {
          startTime: slot.slot.startTime.toISOString(),
          endTime: slot.slot.endTime.toISOString(),
          days: slot.slot.days,
          room: {
            name: slot.slot.room.name
          }
        },
        teacher: slot.teacher ? {
          id: slot.teacher.id,
          firstName: slot.teacher.firstName,
          lastName: slot.teacher.lastName
        } : null
      }))

      return NextResponse.json({
        students: serializableStudents,
        courseSlots: serializableCourseSlots
      })
    }

    if (logsOnly) {
      const logs = await prisma.smsMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              name: true
            }
          }
        }
      })

      const serializableLogs = logs.map(log => ({
        id: log.id,
        studentId: log.studentId,
        studentName: log.student?.name ?? null,
        studentCode: log.student?.studentId ?? '',
        message: log.message,
        direction: log.direction,
        status: log.status,
        createdAt: log.createdAt.toISOString()
      }))

      return NextResponse.json(serializableLogs)
    }

    if (studentId) {
      // Validate UUID format
      if (!studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return NextResponse.json(
          { error: 'Invalid student ID format' },
          { status: 400 }
        )
      }

      const messages = await prisma.smsMessage.findMany({
        where: { studentId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          message: true,
          direction: true,
          status: true,
          createdAt: true,
          textbeeId: true,
          errorMsg: true
        }
      })

      return NextResponse.json(messages.map(message => ({
        ...message,
        createdAt: message.createdAt.toISOString()
      })))
    }

    // Fetch all students with SMS conversations
    const studentsWithMessages = await prisma.student.findMany({
      where: {
        smsMessages: { some: {} }
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        phone: true,
        smsMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            message: true,
            direction: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    // Sort by most recent message
    const sorted = studentsWithMessages.sort((a, b) => {
      const dateA = a.smsMessages[0]?.createdAt ? new Date(a.smsMessages[0].createdAt) : new Date(0)
      const dateB = b.smsMessages[0]?.createdAt ? new Date(b.smsMessages[0].createdAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json(sorted.map(student => ({
      ...student,
      smsMessages: student.smsMessages.map(message => ({
        ...message,
        createdAt: message.createdAt.toISOString()
      }))
    })))
  } catch (error) {
    console.error('GET /api/admin/sms/inbox error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to fetch messages', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/sms/inbox
 * Send SMS to a student
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin } = await verifyAdminApiRole()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = SendSmsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { studentId, message } = validation.data

    // Fetch student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, phone: true, studentId: true }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (!student.phone) {
      return NextResponse.json(
        { error: 'Student has no phone number on file' },
        { status: 422 }
      )
    }

    // Send SMS via Textbee
    const smsResponse = await sendTextbeeSms(student.phone, message)

    // Determine final status - only use valid enum values
    const validStatuses = ['PENDING', 'SENT', 'DELIVERED', 'FAILED'] as const
    const finalStatus = smsResponse.success
      ? (smsResponse.status && validStatuses.includes(smsResponse.status) ? smsResponse.status : 'SENT')
      : 'FAILED'

    // Store in database
    const smsRecord = await prisma.smsMessage.create({
      data: {
        studentId: student.id,
        phoneNumber: student.phone,
        message: message,
        direction: 'OUTBOUND',
        status: finalStatus,
        textbeeId: smsResponse.textbeeId || null,
        errorMsg: smsResponse.error || null,
        sentAt: smsResponse.success ? new Date() : null
      },
      select: {
        id: true,
        message: true,
        direction: true,
        status: true,
        createdAt: true,
        textbeeId: true,
        errorMsg: true
      }
    })

    // Log SMS send attempt
    console.info(`SMS sent to ${student.studentId} (${student.phone}): Status=${finalStatus}`, {
      smsId: smsRecord.id,
      textbeeId: smsResponse.textbeeId
    })

    return NextResponse.json(smsRecord, { status: 201 })

  } catch (error) {
    console.error('POST /api/admin/sms/inbox error:', error instanceof Error ? error.message : String(error), { error })
    return NextResponse.json(
      {
        error: 'Failed to send message',
        code: 'SEND_ERROR'
      },
      { status: 500 }
    )
  }
}
