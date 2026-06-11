import prisma from '@/lib/prisma'
import { PageLayout, PageHeader } from '@/components/ui'
import { ReceptionistSchedulePanel, type ReceptionistRoomGroup } from '@/components/receptionist/receptionist-schedule-panel'

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
    id: string
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
    orderBy: [
      { slot: { room: { name: 'asc' } } },
      { slot: { startTime: 'asc' } }
    ]
  })

  const roomGroups = new Map<string, ReceptionistRoomGroup>()

  assignments.forEach((assignment) => {
    const { slot, course, enrollments } = assignment
    const studentList = enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      enrollmentId: enrollment.id,
      name: enrollment.student.name,
      fatherName: enrollment.student.fatherName,
      phone: enrollment.student.phone
    }))

    const roomKey = slot.room.name
    const timingKey = slot.id

    const timing = {
      slotId: slot.id,
      days: slot.days,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      assignments: [
        {
          id: assignment.id,
          courseName: course.name,
          enrolledCount: studentList.length,
          students: studentList
        }
      ],
      totalEnrolled: studentList.length,
      seatsLeft: 0
    }

    if (!roomGroups.has(roomKey)) {
      roomGroups.set(roomKey, {
        roomName: slot.room.name,
        roomCapacity: slot.room.capacity,
        timings: [],
        totalEnrolled: 0,
        totalCourses: 0,
        seatsLeft: 0
      })
    }

    const roomGroup = roomGroups.get(roomKey)!
    const existingTiming = roomGroup.timings.find((item) => item.slotId === timingKey)

    if (existingTiming) {
      existingTiming.assignments.push(...timing.assignments)
      existingTiming.totalEnrolled += timing.totalEnrolled
    } else {
      roomGroup.timings.push(timing)
    }

    roomGroup.totalEnrolled += timing.totalEnrolled
    roomGroup.totalCourses += 1
  })

  const roomGroupArray: ReceptionistRoomGroup[] = Array.from(roomGroups.values())
    .map((room) => {
      const seatsLeft = Math.max(0, room.roomCapacity - room.totalEnrolled)
      return {
        ...room,
        seatsLeft,
        timings: room.timings
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((timing) => ({
            ...timing,
            seatsLeft: Math.max(0, room.roomCapacity - timing.totalEnrolled)
          }))
      }
    })
    .sort((a, b) => a.roomName.localeCompare(b.roomName))

  return (
    <PageLayout>
      <PageHeader
        title="Receptionist Schedule"
        description="Search room-based schedules, expand a room to view timing slots, and tap into course details cleanly."
      />

      <ReceptionistSchedulePanel roomGroups={roomGroupArray} />
    </PageLayout>
  )
}
