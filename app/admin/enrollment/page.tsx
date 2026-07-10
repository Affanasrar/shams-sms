// app/admin/enrollment/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, CalendarDays, Plus, Sparkles, Users } from 'lucide-react'
import { EnrollmentFilters } from './enrollment-filters'
import { PageLayout } from '@/components/ui'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { subDays } from 'date-fns'
import { EnrollmentTable, EnrollmentRow } from '@/components/enrollment/enrollment-table'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EnrollmentIndex(props: Props) {
  const searchParams = await props.searchParams

  const courseId = searchParams.courseId as string | undefined
  const slotId = searchParams.slotId as string | undefined
  const searchQuery = searchParams.search as string | undefined

  const now = new Date()
  const startDate = searchParams.start ? new Date(searchParams.start as string) : subDays(now, 30)
  const endDate = searchParams.end ? new Date(searchParams.end as string) : now
  endDate.setHours(23, 59, 59, 999)

  const toJSON = <T,>(data: T): T => JSON.parse(JSON.stringify(data, (_, value) => {
    if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
      return Number(value)
    }
    return value
  })) as T

  const coursesData = await prisma.course.findMany({ orderBy: { name: 'asc' } })
  const courses: typeof coursesData = toJSON(coursesData)

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

  const slots = slotsData
    .filter((s) => s.room)
    .map((s) => ({
      id: s.id,
      startTime: s.startTime,
      days: s.days,
      room: { name: s.room!.name }
    }))

  const whereClause: Prisma.EnrollmentWhereInput = {
    status: 'ACTIVE'
  }

  if (searchParams.start || searchParams.end) {
    whereClause.joiningDate = { gte: startDate, lte: endDate }
  }

  if (courseId) {
    whereClause.courseOnSlot = { courseId: courseId }
  }

  if (slotId) {
    if (whereClause.courseOnSlot) {
      whereClause.courseOnSlot.slotId = slotId
    } else {
      whereClause.courseOnSlot = { slotId: slotId }
    }
  }

  if (searchQuery && searchQuery.trim()) {
    whereClause.OR = [
      { student: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { student: { studentId: { contains: searchQuery, mode: 'insensitive' } } }
    ]
  }

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

  const enrollments: typeof enrollmentsData = toJSON(enrollmentsData)

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

  const activeCount = rows.length
  const courseCount = new Set(rows.map((row) => row.courseName)).size
  const slotCount = new Set(rows.map((row) => row.currentSlotId)).size

  return (
    <PageLayout className="space-y-6">
      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              <Sparkles size={16} />
              Premium enrollment hub
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Active Enrollments</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Keep every active student placement organized with a calmer, faster workflow for course, slot, and student management.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <DateRangePicker />
            <Link
              href="/admin/enrollment/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              New Enrollment
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Users size={16} className="text-indigo-600" />
              Active students
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <BookOpen size={16} className="text-emerald-600" />
              Courses in view
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{courseCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarDays size={16} className="text-amber-600" />
              Active slots
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{slotCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-5">
        <EnrollmentFilters courses={courses} slots={slots} />
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-col gap-2 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Enrollment roster</p>
            <p className="text-sm text-slate-500">A clear view of current placements and available options.</p>
          </div>
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{rows.length}</span> active enrollment{rows.length !== 1 ? 's' : ''}
          </div>
        </div>

        {(courseId || slotId || searchQuery) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span>Filtered by</span>
            {searchQuery && <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">{searchQuery}</span>}
            {courseId && <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">{courses.find((c) => c.id === courseId)?.name}</span>}
            {slotId && <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">{slots.find((s) => s.id === slotId)?.days}</span>}
            <Link href="/admin/enrollment" className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700">
              Clear all
            </Link>
          </div>
        )}

        <EnrollmentTable data={rows} />
      </section>
    </PageLayout>
  )
}