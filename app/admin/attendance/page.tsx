// app/admin/attendance/page.tsx
import prisma from '@/lib/prisma'
import { Calendar } from 'lucide-react'
import { PageLayout, PageHeader } from '@/components/ui'
import { AttendanceFilters } from './attendance-filters'

export const dynamic = 'force-dynamic'

export default async function AdminAttendancePage() {
  // Helper function to convert Decimals to plain JSON objects
  const toJSON = (data: any) => JSON.parse(JSON.stringify(data, (_, value) => {
    if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
      return Number(value)
    }
    return value
  }))

  // Fetch all active classes with their enrollments and attendance
  const today = new Date().toISOString().split('T')[0]
  
  const classes = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: { include: { room: true } },
      teacher: true,
      enrollments: { 
        where: { status: 'ACTIVE' },
        select: { id: true, studentId: true, student: { select: { id: true, name: true } } }
      }
    },
    orderBy: { course: { name: 'asc' } }
  })

  // Fetch attendance records for today
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      date: new Date(today)
    },
    select: {
      courseOnSlotId: true,
      studentId: true,
      status: true
    }
  })

  // Group classes by course and add attendance info
  const courseMap = new Map<string, any>()
  classes.forEach(cls => {
    const courseId = cls.courseId
    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        id: courseId,
        name: cls.course.name,
        baseFee: typeof cls.course.baseFee === 'object' ? Number(cls.course.baseFee) : cls.course.baseFee,
        classes: []
      })
    }
    
    // Calculate present count for this class
    const classAttendance = attendanceRecords.filter(r => r.courseOnSlotId === cls.id)
    const presentCount = classAttendance.filter(r => r.status === 'PRESENT').length
    const totalEnrolled = cls.enrollments.length
    const isMarked = classAttendance.length > 0

    courseMap.get(courseId).classes.push({
      ...cls,
      course: toJSON(cls.course),
      presentCount,
      totalEnrolled,
      isMarked
    })
  })

  const courses: typeof courseMap extends Map<string, infer V> ? V[] : never = toJSON(Array.from(courseMap.values()))

  return (
    <PageLayout>
      <PageHeader
        title="Attendance Management"
        description="View and manage student attendance across all classes"
        backHref="/admin"
        backLabel="Back to Dashboard"
      />

      <AttendanceFilters courses={courses} />

      {courses.length === 0 && (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
          <p className="text-gray-500">There are no active classes to manage attendance for.</p>
        </div>
      )}
    </PageLayout>
  )
}