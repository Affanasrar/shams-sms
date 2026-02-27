// app/admin/enrollment/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { EnrollmentFilters } from './enrollment-filters'
import { PageLayout, PageHeader } from '@/components/ui'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { subDays } from 'date-fns'
import { EnrollmentTable, EnrollmentRow } from '@/components/enrollment/enrollment-table'

// 👇 FIX: Force dynamic rendering to ensure fresh data after enrollments
export const dynamic = 'force-dynamic'

// 👇 Define the props type correctly for Next.js 15+
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EnrollmentIndex(props: Props) {
  // 1. 👇 AWAIT the searchParams (Critical Fix)
  const searchParams = await props.searchParams
  
  const courseId = searchParams.courseId as string | undefined
  const slotId = searchParams.slotId as string | undefined
  const searchQuery = searchParams.search as string | undefined

  // date range for joining date, default last 30 days
  const now = new Date()
  const startDate = searchParams.start ? new Date(searchParams.start as string) : subDays(now, 30)
  const endDate = searchParams.end ? new Date(searchParams.end as string) : now
  endDate.setHours(23, 59, 59, 999)

  // Helper function to convert Decimals to plain JSON objects
  // Prisma Decimal objects can't be passed to client components
  // Using JSON.stringify/parse converts Decimals to their string representation
  const toJSON = (data: any) => JSON.parse(JSON.stringify(data, (_, value) => {
    // Convert Decimal instances to numbers if they have toFixed method
    if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
      return Number(value)
    }
    return value
  }))

  // 2. Fetch Filter Options
  const coursesData = await prisma.course.findMany({ orderBy: { name: 'asc' } })
  const courses: typeof coursesData = toJSON(coursesData)
  
  // Fetch slots - filter by course if one is selected
  const slotsData = await prisma.slot.findMany({
    where: courseId ? {
      courses: {
        some: {
          courseId: courseId
        }
      }
    } : undefined,
    include: { room: true },
    orderBy: { startTime: 'asc' }
  })
  // Convert to plain objects, ensuring room exists
  const slots = slotsData
    .filter(s => s.room) // Only include slots with a room
    .map(s => ({
      id: s.id,
      startTime: s.startTime,
      days: s.days,
      room: { name: s.room!.name }
    }))

  // 3. Build Dynamic Query
  // We start with the base requirement: Status must be ACTIVE
  const whereClause: any = { 
    status: 'ACTIVE',
    joiningDate: { gte: startDate, lte: endDate }
  }

  // If a Course is selected, add it to the filter
  if (courseId) {
    whereClause.courseOnSlot = { courseId: courseId }
  }

  // If a Slot is selected, add it to the filter
  if (slotId) {
    if (whereClause.courseOnSlot) {
      whereClause.courseOnSlot.slotId = slotId
    } else {
      whereClause.courseOnSlot = { slotId: slotId }
    }
  }

  // If search query exists, filter by student name or ID
  if (searchQuery && searchQuery.trim()) {
    whereClause.OR = [
      { student: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { student: { studentId: { contains: searchQuery, mode: 'insensitive' } } }
    ]
  }

  // 4. Fetch Enrollments
  const enrollmentsData = await prisma.enrollment.findMany({
    where: whereClause,
    include: {
      student: true,
      courseOnSlot: {
        include: {
          course: true,
          slot: { include: { room: true } }
        }
      }
    },
    orderBy: { joiningDate: 'desc' }
  })

  // Convert Decimals to numbers in enrollments
  const enrollments: typeof enrollmentsData = toJSON(enrollmentsData)

  // 5. Fetch all slots with enrollment counts for each course
  // This helps us show available timings when changing student slots
  const slotsWithEnrollmentsData = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: {
        include: { room: true }
      },
      _count: {
        select: {
          enrollments: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    },
    orderBy: { slot: { startTime: 'asc' } }
  })

  // Convert Decimals to numbers in slotsWithEnrollments
  const slotsWithEnrollments: typeof slotsWithEnrollmentsData = toJSON(slotsWithEnrollmentsData)

  const rows: EnrollmentRow[] = enrollments.map((record) => ({
    id: record.id,
    studentId: record.student.studentId,
    studentName: record.student.name,
    fatherName: record.student.fatherName,
    courseName: record.courseOnSlot.course.name,
    slotDays: record.courseOnSlot.slot.days,
    slotStartTime: record.courseOnSlot.slot.startTime,
    slotRoom: record.courseOnSlot.slot.room.name,
    joiningDate: record.joiningDate,
    status: record.status,
    currentSlotId: record.courseOnSlot.slot.id,
    currentCourseOnSlotId: record.courseOnSlot.id,
    currentTiming: {
      days: record.courseOnSlot.slot.days,
      startTime: record.courseOnSlot.slot.startTime,
      endTime: record.courseOnSlot.slot.endTime,
      room: record.courseOnSlot.slot.room.name,
    },
    availableSlotsForCourse: slotsWithEnrollments
      .filter((s) => s.courseId === record.courseOnSlot.courseId)
      .map((s) => ({
        id: s.id,
        days: s.slot.days,
        startTime: s.slot.startTime,
        endTime: s.slot.endTime,
        room: { name: s.slot.room.name, capacity: s.slot.room.capacity },
        enrollmentCount: s._count.enrollments,
      })),
  }))

  return (
    <PageLayout>
      <PageHeader
        title="Active Enrollments"
        description="Manage student enrollments across all courses and time slots"
        backHref="/admin"
        backLabel="Back to Dashboard"
        actions={
          <>
            <DateRangePicker />
            <Link
              href="/admin/enrollment/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus size={16} />
              New Enrollment
            </Link>
          </>
        }
      />

      {/* Render the Filters */}
      <EnrollmentFilters courses={courses} slots={slots} />

      <div className="px-6 py-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{rows.length}</span> enrollment{rows.length !== 1 ? 's' : ''}
          {(courseId || slotId || searchQuery) && (
            <span> •
              {searchQuery && ` Search: "${searchQuery}"`}
              {searchQuery && (courseId || slotId) && ' •'}
              {courseId && ` Course: ${courses.find(c => c.id === courseId)?.name}`}
              {courseId && slotId && ' •'}
              {slotId && ` Slot: ${slots.find(s => s.id === slotId)?.days}`}
            </span>
          )}
        </p>
        {(courseId || slotId || searchQuery) && (
          <Link
            href="/admin/enrollment"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters
          </Link>
        )}
      </div>

      <EnrollmentTable data={rows} />
    </PageLayout>
  )
}