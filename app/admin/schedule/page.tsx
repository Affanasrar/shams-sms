// app/admin/schedule/page.tsx
import prisma from '@/lib/prisma'
import { SlotCard } from './slot-card'
import { CalendarDays, Settings } from 'lucide-react'
import Link from 'next/link'
import { Course, FeeType } from '@prisma/client'
import { ManagementPanel } from './management-panel'
import { PageLayout, PageHeader } from '@/components/ui'
import { ScheduleFilters } from './schedule-filters'

// Force fresh data every time so capacity is accurate
export const dynamic = 'force-dynamic'

type CourseWithAssignments = {
  id: string
  name: string
  durationMonths: number
  baseFee: any // Decimal
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

// 👇 THIS "export default" IS REQUIRED BY NEXT.JS
export default async function SchedulePage() {
  
  // Helper function to convert Decimals to plain JSON objects
  const toJSON = (data: any) => JSON.parse(JSON.stringify(data, (_, value) => {
    if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
      return Number(value)
    }
    return value
  }))
  
  // Fetch all slot assignments with course, slot, and enrollment data
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: {
        include: { room: true }
      },
      teacher: true,
      enrollments: {
        where: { status: 'ACTIVE' },
        select: { 
          endDate: true,
          student: {
            select: {
              id: true,
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
  assignments.forEach(assignment => {
    const courseId = assignment.courseId
    if (!coursesMap.has(courseId)) {
      coursesMap.set(courseId, {
        id: courseId,
        name: assignment.course.name,
        durationMonths: assignment.course.durationMonths,
        baseFee: typeof assignment.course.baseFee === 'object' ? Number(assignment.course.baseFee) : assignment.course.baseFee,
        feeType: assignment.course.feeType,
        slotAssignments: []
      })
    }
    // Also convert Decimal in the assignment's nested course object
    const assignmentToAdd = {
      ...assignment,
      course: {
        ...assignment.course,
        baseFee: typeof assignment.course.baseFee === 'object' ? Number(assignment.course.baseFee) : assignment.course.baseFee
      }
    }
    coursesMap.get(courseId).slotAssignments.push(assignmentToAdd)
  })

  const courses: CourseWithAssignments[] = Array.from(coursesMap.values())
 
  // Compute occupancy per slot across all assignments (shared capacity)
  const slotOccupancyMap = new Map<string, number>()
  assignments.forEach(a => {
    const slotId = a.slot?.id || a.slotId || ''
    const count = (a.enrollments || []).length
    if (!slotId) return
    slotOccupancyMap.set(slotId, (slotOccupancyMap.get(slotId) || 0) + count)
  })
  // Fetch additional data for management
  const rooms = await prisma.room.findMany()
  const allCoursesData = await prisma.course.findMany({ orderBy: { name: 'asc' } })
  const allCourses = toJSON(allCoursesData)
  
  const slots = await prisma.slot.findMany({
    include: { room: true },
    orderBy: { startTime: 'asc' }
  })
  const teachers = await prisma.user.findMany({
    where: { 
      OR: [
        { role: 'TEACHER' },
        { role: 'ADMIN' }
      ]
    },
    orderBy: { firstName: 'asc' }
  })
  
  const coursesWithAssignments = toJSON(courses)

  return (
    <PageLayout>
      <PageHeader
        title="Course Timetables & Capacity"
        description="Monitor all courses, their schedules, capacity, and current enrollments"
        backHref="/admin"
        backLabel="Back to Dashboard"
        actions={
          <ManagementPanel
            rooms={rooms}
            courses={allCourses}
            coursesWithAssignments={coursesWithAssignments}
            slots={slots}
            teachers={teachers}
          />
        }
      />

      <ScheduleFilters courses={courses} teachers={teachers} slots={slots} />
    </PageLayout>
  )
}