import prisma from '@/lib/prisma'
import { PageLayout, PageHeader } from '@/components/ui'
import { ReceptionistSchedulePanel, type SlotGroup } from '@/components/receptionist/receptionist-schedule-panel'

export const dynamic = 'force-dynamic'

type ScheduleAssignment = {
  id: string
  course: { name: string }
  slot: {
    id: string
    startTime: Date
    endTime: Date
    days: string
    room: { name: string; capacity: number }
  }
  enrollments: {
    student: { id: string; name: string; fatherName: string; phone: string }
  }[]
}

export default async function ReceptionistSchedulePage() {
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: { include: { room: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          student: {
            select: {
              id: true,
              name: true,
              fatherName: true,
              phone: true
            }
          }
        }
      }
    },
    orderBy: {
      slot: {
        startTime: 'asc'
      }
    }
  })

  const groups = new Map<string, SlotGroup>()

  assignments.forEach((assignment) => {
    const slot = assignment.slot
    const slotKey = slot.id
    const studentList = assignment.enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      enrollmentId: enrollment.id,
      name: enrollment.student.name,
      fatherName: enrollment.student.fatherName,
      phone: enrollment.student.phone
    }))

    if (!groups.has(slotKey)) {
      groups.set(slotKey, {
        slotId: slot.id,
        days: slot.days,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        room: { name: slot.room.name, capacity: slot.room.capacity },
        assignments: [],
        totalEnrolled: 0,
        seatsLeft: 0
      })
    }

    const existing = groups.get(slotKey)!
    existing.assignments.push({
      id: assignment.id,
      courseName: assignment.course.name,
      enrolledCount: studentList.length,
      students: studentList
    })
    existing.totalEnrolled += studentList.length
  })

  const slotGroups: SlotGroup[] = Array.from(groups.values()).map((group) => {
    const totalEnrolled = group.totalEnrolled
    const seatsLeft = Math.max(0, group.room.capacity - totalEnrolled)
    return { ...group, seatsLeft }
  })

  return (
    <PageLayout>
      <PageHeader
        title="Receptionist Schedule"
        description="Search batch timings, review all courses in the same room and slot, and open the student list with one tap."
      />

      <ReceptionistSchedulePanel slotGroups={slotGroups} />
    </PageLayout>
  )
}
