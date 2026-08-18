// app/admin/schedule/page.tsx
import prisma from '@/lib/prisma'
import { SlotCard } from './slot-card'
import { CalendarDays, Settings, Users, Building2, Clock, Sparkles, Plus, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { FeeType } from '@prisma/client'
import { ManagementPanel } from './management-panel'
import { PageLayout, PageHeader } from '@/components/ui'
import { ScheduleFilters } from './schedule-filters'
import { getSlotSeatSummary } from '@/lib/seat-engine'

// Force fresh data every time so capacity is accurate
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
  
  // Fetch additional data for management
  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } })
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
  const rawAssignments = toJSON(assignments)
  const safeRooms = toJSON(rooms)

  // Compute live KPI summary stats
  const totalOccupants = assignments.reduce((sum, a) => sum + (a.enrollments?.length || 0), 0)
  const slotGroupsMap = new Map<string, any>()
  assignments.forEach((a) => {
    const sId = a.slot.id
    if (!slotGroupsMap.has(sId)) {
      slotGroupsMap.set(sId, { capacity: a.slot.room.capacity, count: 0 })
    }
    slotGroupsMap.get(sId).count += (a.enrollments?.length || 0)
  })

  let totalFreeSeats = 0
  slotGroupsMap.forEach((v) => {
    totalFreeSeats += Math.max(0, v.capacity - v.count)
  })

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Modern Schedule Header Banner */}
        <div className="relative overflow-hidden rounded-[32px] border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Sparkles size={12} />
                Live Timetables & Capacity
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Classroom Schedule & Matrix
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Master schedule view with live lab occupancy, 2D Timetable Matrix, and 1-click student slot transfers.
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/admin/enrollment/new"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-indigo-700 cursor-pointer"
              >
                <Plus size={16} />
                <span>Enroll Student</span>
              </Link>

              <Link
                href="/admin/schedule/settings"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <Settings size={15} className="text-muted-foreground" />
                <span>Schedule Settings</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/80 pt-5">
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                <Clock size={11} /> Total Slots
              </span>
              <p className="mt-1 text-lg sm:text-xl font-bold text-foreground">{slots.length}</p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                <Building2 size={11} /> Rooms & Labs
              </span>
              <p className="mt-1 text-lg sm:text-xl font-bold text-foreground">{rooms.length}</p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                <Users size={11} /> Enrolled Students
              </span>
              <p className="mt-1 text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalOccupants}</p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles size={11} /> Open Seat Capacity
              </span>
              <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalFreeSeats} Free</p>
            </div>
          </div>
        </div>

        {/* Schedule Views & Filters */}
        <ScheduleFilters
          courses={courses}
          teachers={teachers}
          slots={slots}
          rawAssignments={rawAssignments}
          rooms={safeRooms}
        />
      </div>
    </PageLayout>
  )
}