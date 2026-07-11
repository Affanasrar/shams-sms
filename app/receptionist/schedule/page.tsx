import prisma from '@/lib/prisma'
import { PageLayout } from '@/components/ui'
import { ReceptionistSchedulePanel, type ReceptionistRoomGroup } from '@/components/receptionist/receptionist-schedule-panel'
import { ReceptionistSummaryGrid } from '@/components/receptionist/receptionist-summary-grid'
import { BadgeCheck, CalendarDays, Layers3, Users } from 'lucide-react'

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
        totalCapacity: 0,
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
      const totalCapacity = room.timings.length * room.roomCapacity
      const seatsLeft = room.timings.reduce((sum, timing) => sum + Math.max(0, room.roomCapacity - timing.totalEnrolled), 0)
      return {
        ...room,
        totalCapacity,
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

  const totalTimings = roomGroupArray.reduce((sum, room) => sum + room.timings.length, 0)
  const totalStudents = roomGroupArray.reduce((sum, room) => sum + room.totalEnrolled, 0)

  return (
    <PageLayout>
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
              <BadgeCheck size={12} />
              Schedule control
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Room-based schedules with clarity and breathing room.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Search rooms, inspect timings, and expand only what you need without loading the whole page with noise.
              </p>
            </div>
          </div>
          <ReceptionistSummaryGrid
            items={[
              { label: 'Rooms', value: roomGroupArray.length, icon: <CalendarDays size={16} /> },
              { label: 'Timings', value: totalTimings, icon: <Layers3 size={16} /> },
              { label: 'Students', value: totalStudents, icon: <Users size={16} /> },
              { label: 'View', value: 'Expandable', icon: <BadgeCheck size={16} /> }
            ]}
          />
        </div>
      </section>

      <ReceptionistSchedulePanel roomGroups={roomGroupArray} />
    </PageLayout>
  )
}

