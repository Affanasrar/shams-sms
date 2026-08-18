// app/admin/schedule/settings/page.tsx
import prisma from '@/lib/prisma'
import { PageLayout } from '@/components/ui'
import { ScheduleSettingsClient } from './schedule-settings-client'
import { FeeType } from '@prisma/client'

export const dynamic = 'force-dynamic'

type CourseWithAssignments = {
  id: string
  name: string
  durationMonths: number
  baseFee: any
  feeType: FeeType
  slotAssignments: {
    id: string
    course: { name: string; durationMonths: number }
    slot: {
      id: string
      startTime: Date
      endTime: Date
      days: string
      room: { name: string; capacity: number; id: string }
    }
    enrollments: {
      endDate: Date | null
      student: {
        id: string
        name: string
        phone: string
        fatherName: string
      }
    }[]
    teacher?: { id: string; firstName: string | null; lastName: string | null } | null
  }[]
}

export default async function ScheduleSettingsPage() {
  const toJSON = (data: any) =>
    JSON.parse(
      JSON.stringify(data, (_, value) => {
        if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
          return Number(value)
        }
        return value
      })
    )

  // Fetch all assignments
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: {
        include: { room: true }
      },
      teacher: true,
      enrollments: {
        where: { status: { in: ['ACTIVE', 'PENDING_COMPLETION'] } },
        select: {
          id: true,
          status: true,
          joiningDate: true,
          endDate: true,
          student: {
            select: {
              id: true,
              studentId: true,
              name: true,
              phone: true,
              fatherName: true
            }
          }
        }
      }
    },
    orderBy: { course: { name: 'asc' } }
  })

  // Group assignments by course
  const coursesMap = new Map()
  assignments.forEach((assignment) => {
    const courseId = assignment.courseId
    if (!coursesMap.has(courseId)) {
      coursesMap.set(courseId, {
        id: courseId,
        name: assignment.course.name,
        durationMonths: assignment.course.durationMonths,
        baseFee:
          typeof assignment.course.baseFee === 'object'
            ? Number(assignment.course.baseFee)
            : assignment.course.baseFee,
        feeType: assignment.course.feeType,
        slotAssignments: []
      })
    }
    const assignmentToAdd = {
      ...assignment,
      course: {
        ...assignment.course,
        baseFee:
          typeof assignment.course.baseFee === 'object'
            ? Number(assignment.course.baseFee)
            : assignment.course.baseFee
      }
    }
    coursesMap.get(courseId).slotAssignments.push(assignmentToAdd)
  })

  const courses: CourseWithAssignments[] = Array.from(coursesMap.values())

  // Fetch data for configuration
  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } })
  const allCoursesData = await prisma.course.findMany({ orderBy: { name: 'asc' } })
  const allCourses = toJSON(allCoursesData)

  const slots = await prisma.slot.findMany({
    include: { room: true },
    orderBy: { startTime: 'asc' }
  })

  const teachers = await prisma.user.findMany({
    where: {
      OR: [{ role: 'TEACHER' }, { role: 'ADMIN' }]
    },
    orderBy: { firstName: 'asc' }
  })

  const coursesWithAssignments = toJSON(courses)
  const safeRooms = toJSON(rooms)
  const safeSlots = toJSON(slots)
  const safeTeachers = toJSON(teachers)

  return (
    <PageLayout>
      <ScheduleSettingsClient
        rooms={safeRooms}
        courses={allCourses}
        coursesWithAssignments={coursesWithAssignments}
        slots={safeSlots}
        teachers={safeTeachers}
      />
    </PageLayout>
  )
}
