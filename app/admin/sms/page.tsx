// app/admin/sms/page.tsx
import prisma from '@/lib/prisma'
import { SmsSender } from './sms-sender'

export default async function SmsPage() {
  const [students, courseSlots, logs] = await Promise.all([
    prisma.student.findMany({
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
                status: { in: ['UNPAID', 'PARTIAL'] },
                dueDate: {
                  lte: new Date()
                }
              },
              orderBy: {
                dueDate: 'desc'
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.courseOnSlot.findMany({
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
    }),
    prisma.feeReminderLog.findMany({
      orderBy: { sentAt: 'desc' },
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
  ])

  const plainStudents = students.map((student) => ({
    id: student.id,
    studentId: student.studentId,
    name: student.name,
    fatherName: student.fatherName,
    phone: student.phone,
    enrollments: student.enrollments
      .filter((enrollment) => enrollment.courseOnSlot && enrollment.courseOnSlot.course) // Filter out enrollments without course data
      .map((enrollment) => ({
      courseOnSlot: {
        id: enrollment.courseOnSlot.id,
        course: {
          id: enrollment.courseOnSlot!.course.id,
          name: enrollment.courseOnSlot!.course.name
        }
      },
      fees: enrollment.fees.map((fee) => ({
        id: fee.id,
        finalAmount: Number(fee.finalAmount),
        dueDate: fee.dueDate.toISOString(),
        cycleDate: fee.cycleDate?.toISOString() ?? null,
      }))
    }))
  }))

  const plainLogs = logs.map((log) => ({
    id: log.id,
    studentId: log.studentId,
    studentName: log.student?.name ?? 'Unknown',
    studentCode: log.student?.studentId ?? '',
    feeIds: log.feeIds,
    sentAt: log.sentAt.toISOString(),
    status: log.status,
    details: log.details,
    error: log.error,
  }))

  const plainCourseSlots = courseSlots.map((courseSlot) => ({
    id: courseSlot.id,
    course: {
      id: courseSlot.course.id,
      name: courseSlot.course.name
    },
    slot: {
      startTime: courseSlot.slot.startTime.toISOString(),
      endTime: courseSlot.slot.endTime.toISOString(),
      days: courseSlot.slot.days,
      room: {
        name: courseSlot.slot.room.name
      }
    },
    teacher: courseSlot.teacher ? {
      id: courseSlot.teacher.id,
      firstName: courseSlot.teacher.firstName,
      lastName: courseSlot.teacher.lastName
    } : null
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Send Custom SMS to Students</h1>
          <p className="text-gray-600 mt-1">Send custom messages to students. Due date reminders are sent automatically by the daily cron job.</p>
        </div>
      </div>

      <SmsSender students={plainStudents} courseSlots={plainCourseSlots} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent SMS Reminder Logs</h2>
            <p className="text-sm text-gray-600">Recent automatic reminder attempts from the fee reminder cron.</p>
          </div>
        </div>

        {plainLogs.length === 0 ? (
          <div className="text-sm text-gray-600">No SMS reminder logs found yet.</div>
        ) : (
          <div className="space-y-3">
            {plainLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">{log.studentName} ({log.studentCode})</div>
                    <div className="text-sm text-gray-600">Sent: {new Date(log.sentAt).toLocaleString()}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm font-semibold ${log.status === 'SENT' ? 'bg-green-100 text-green-800' : log.status === 'SKIPPED' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {log.status}
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-700">{log.details}</div>
                {log.error && (
                  <div className="mt-2 text-sm text-red-700">Error: {log.error}</div>
                )}
                <div className="mt-2 text-xs text-gray-500">Fee IDs: {log.feeIds.join(', ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}