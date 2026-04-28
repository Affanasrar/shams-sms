// app/admin/dropped-students/page.tsx
import prisma from '@/lib/prisma'
import { PageLayout, PageHeader } from '@/components/ui'
import { DroppedStudentFilters, DroppedStudentTable } from '@/components/dropped-students'
import type { DroppedStudentRow } from '@/components/dropped-students/dropped-student-table'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DroppedStudentsPage(props: Props) {
  // Await the searchParams (Critical for Next.js 15+)
  const searchParams = await props.searchParams

  const courseId = searchParams.courseId as string | undefined
  const searchQuery = searchParams.search as string | undefined
  const sortBy = searchParams.sort as string | undefined

  // Helper function to convert Decimals to plain JSON objects
  const toJSON = (data: any) => JSON.parse(JSON.stringify(data, (_, value) => {
    if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
      return Number(value)
    }
    return value
  }))

  // Fetch all courses for filter dropdown
  const coursesData = await prisma.course.findMany({ orderBy: { name: 'asc' } })
  const courses: typeof coursesData = toJSON(coursesData)

  // Build dynamic query for dropped enrollments
  const whereClause: any = {
    status: 'DROPPED'
  }

  // If a Course is selected, add it to the filter
  if (courseId) {
    whereClause.courseOnSlot = { courseId: courseId }
  }

  // If search query exists, filter by student name or ID
  if (searchQuery && searchQuery.trim()) {
    whereClause.OR = [
      { student: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { student: { studentId: { contains: searchQuery, mode: 'insensitive' } } }
    ]
  }

  // Fetch dropped enrollments with all needed data
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
    orderBy:
      sortBy === 'oldest'
        ? { endDate: 'asc' }
        : sortBy === 'name'
          ? { student: { name: 'asc' } }
          : { endDate: 'desc' } // default: recent drops
  })

  // Convert Decimals to numbers
  const enrollments: typeof enrollmentsData = toJSON(enrollmentsData)

  // Calculate days dropped for each enrollment
  const now = new Date()
  const rows: DroppedStudentRow[] = enrollments.map((record) => {
    const droppedDate = record.endDate ? new Date(record.endDate) : new Date(record.joiningDate)
    const daysDropped = Math.floor((now.getTime() - droppedDate.getTime()) / (1000 * 60 * 60 * 24))

    // Determine drop reason: duration vs admin
    const joiningDate = new Date(record.joiningDate)
    const expectedEndDate = new Date(joiningDate)
    expectedEndDate.setMonth(expectedEndDate.getMonth() + record.courseOnSlot.course.durationMonths)
    
    // If endDate is within 7 days of expected end date, it's likely a duration drop
    const daysDiff = Math.abs(droppedDate.getTime() - expectedEndDate.getTime()) / (1000 * 60 * 60 * 24)
    const dropReason: 'duration' | 'admin' = daysDiff <= 7 ? 'duration' : 'admin'

    return {
      id: record.id,
      enrollmentId: record.id,
      studentId: record.student.studentId,
      studentName: record.student.name,
      fatherName: record.student.fatherName,
      courseName: record.courseOnSlot.course.name,
      slotDays: record.courseOnSlot.slot.days,
      slotStartTime: new Date(record.courseOnSlot.slot.startTime),
      slotRoom: record.courseOnSlot.slot.room.name,
      joiningDate: new Date(record.joiningDate),
      droppedDate,
      endDate: record.endDate ? new Date(record.endDate) : new Date(),
      extendedDays: record.extendedDays || 0,
      daysDropped: Math.max(0, daysDropped),
      phone: record.student.phone,
      dropReason,
      courseDurationMonths: record.courseOnSlot.course.durationMonths,
    }
  })

  // Count total students by status for stats
  const stats = await prisma.enrollment.aggregate({
    where: { status: 'DROPPED' },
    _count: true
  })

  // Count by course
  const droppedByCourse = await prisma.enrollment.groupBy({
    by: ['courseOnSlotId'],
    where: { status: 'DROPPED' },
    _count: true
  })

  // Count drop reasons
  const adminDropCount = rows.filter(r => r.dropReason === 'admin').length
  const durationDropCount = rows.filter(r => r.dropReason === 'duration').length

  return (
    <PageLayout>
      <PageHeader
        title="Dropped Students"
        description="Manage and review students who have dropped their courses"
        backHref="/admin"
        backLabel="Back to Dashboard"
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 mb-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Dropped Students</p>
          <p className="text-3xl font-bold text-gray-900">{stats._count}</p>
          <p className="text-xs text-gray-500 mt-2">Across all courses</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">📅 Duration Drops</p>
          <p className="text-3xl font-bold text-yellow-600">{durationDropCount}</p>
          <p className="text-xs text-gray-500 mt-2">Course ended naturally</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">🚫 Admin Drops</p>
          <p className="text-3xl font-bold text-red-600">{adminDropCount}</p>
          <p className="text-xs text-gray-500 mt-2">Manually dropped</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">Courses Affected</p>
          <p className="text-3xl font-bold text-gray-900">{droppedByCourse.length}</p>
          <p className="text-xs text-gray-500 mt-2">With dropped students</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">Filtered Results</p>
          <p className="text-3xl font-bold text-gray-900">{rows.length}</p>
          <p className="text-xs text-gray-500 mt-2">
            {courseId ? 'In selected course' : 'All courses'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 mb-6">
        <DroppedStudentFilters courses={courses} />
      </div>

      {/* Table */}
      <div className="px-6">
        {rows.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Showing <span className="font-semibold">{rows.length}</span> dropped student
              {rows.length !== 1 ? 's' : ''}
            </p>
            <DroppedStudentTable data={rows} />
          </>
        ) : (
          <div className="bg-white p-12 rounded-lg border text-center">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No dropped students found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery || courseId ? 'Try adjusting your filters' : 'All students are active or completed'}
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
