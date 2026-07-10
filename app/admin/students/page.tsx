// app/admin/students/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { UserPlus, CalendarDays, Search } from 'lucide-react'
import { subDays } from 'date-fns'
import { StudentTable, StudentRow } from '@/components/students/student-table'
import { StudentFilters } from './student-filters'
import { Prisma } from '@prisma/client'

// 👇 Define the props type correctly for Next.js 15+
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StudentList(props: Props) {
  // 1. 👇 AWAIT the searchParams
  const searchParams = await props.searchParams
  const searchQuery = searchParams.q as string | undefined

  // date range parameters; do not impose default range unless user set one
  const now = new Date()
  const hasRangeFilter = Boolean(searchParams.start || searchParams.end)
  const startDate = searchParams.start ? new Date(searchParams.start as string) : subDays(now, 30)
  const endDate = searchParams.end ? new Date(searchParams.end as string) : now
  endDate.setHours(23, 59, 59, 999)

  // 2. Build Dynamic Query
  const whereClause: Prisma.StudentWhereInput = {}
  if (hasRangeFilter) {
    whereClause.admission = { gte: startDate, lte: endDate }
  }
  
  if (searchQuery && searchQuery.trim()) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { studentId: { contains: searchQuery, mode: 'insensitive' } },
      { phone: { contains: searchQuery, mode: 'insensitive' } },
      { fatherName: { contains: searchQuery, mode: 'insensitive' } }
    ]
  }

  const [students, totalStudents, smsEnabledStudents, recentAdmissions] = await Promise.all([
    prisma.student.findMany({
      where: whereClause,
      orderBy: { admission: 'desc' }
    }),
    prisma.student.count(),
    prisma.student.count({ where: { smsReminderEnabled: true } }),
    prisma.student.count({ where: { admission: { gte: subDays(now, 30) } } })
  ])

  const rows: StudentRow[] = students.map(s => ({
    id: s.id,
    studentId: s.studentId,
    name: s.name,
    fatherName: s.fatherName,
    phone: s.phone,
    admission: s.admission,
    smsReminderEnabled: s.smsReminderEnabled
  }))

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-white/75">
              <Link href="/admin" className="rounded-full border border-white/15 p-2 transition hover:bg-white/10 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <span className="text-xs uppercase tracking-[0.3em]">Student management</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Student Directory</h1>
              <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
                A cleaner workspace to search, review, and manage student records without the noise.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/students/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <UserPlus size={16} />
                New Admission
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/80">
                <Search size={16} />
                Search & filter live
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-lg xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Total students</p>
              <p className="mt-2 text-3xl font-semibold">{totalStudents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">SMS reminders on</p>
              <p className="mt-2 text-3xl font-semibold">{smsEnabledStudents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Recent admissions</p>
              <p className="mt-2 text-2xl font-semibold">{recentAdmissions}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Visible results</p>
              <p className="mt-2 text-2xl font-semibold">{rows.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current view</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{rows.length} students</p>
          <p className="mt-1 text-sm text-slate-500">{searchQuery ? `Filtered by "${searchQuery}"` : 'No search filter applied.'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SMS reminders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{smsEnabledStudents} active</p>
          <p className="mt-1 text-sm text-slate-500">Students receiving SMS updates.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admissions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{recentAdmissions} in 30 days</p>
          <p className="mt-1 text-sm text-slate-500">Recent additions to the institute.</p>
        </div>
      </div>

      <StudentFilters />

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>
          Showing <span className="font-semibold text-slate-900">{rows.length}</span> student{rows.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        <Link href="/admin/students/new" className="inline-flex items-center gap-2 font-medium text-slate-900 transition hover:text-slate-700">
          <CalendarDays size={14} />
          Admit a student
        </Link>
      </div>

      <StudentTable data={rows} />
    </div>
  )
}