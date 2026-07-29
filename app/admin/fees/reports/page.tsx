// app/admin/fees/reports/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Users, BookOpen, Building, TrendingUp } from 'lucide-react'
import { ReportGenerator } from './report-generator'
import { DateRangePicker } from '../../../../components/ui/date-range-picker'
import { FeesReportTable, FeeRow } from '@/components/fees/fees-report-table'
import { subDays } from 'date-fns'

interface ReportsPageProps {
  searchParams: Promise<{ start?: string; end?: string }>
}

export default async function FeesReportsPage(props: ReportsPageProps) {
  const searchParams = await props.searchParams
  const now = new Date()
  const startDate = searchParams.start ? new Date(searchParams.start as string) : subDays(now, 30)
  const endDate = searchParams.end ? new Date(searchParams.end as string) : now
  endDate.setHours(23, 59, 59, 999)

  const [courses, students, fees] = await Promise.all([
    prisma.course.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.student.findMany({
      select: { id: true, studentId: true, name: true, fatherName: true },
      orderBy: { name: 'asc' }
    }),
    prisma.fee.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { student: true }
    })
  ])

  const feeData: FeeRow[] = fees.map(f => ({
    id: f.id,
    studentName: f.student.name,
    finalAmount: Number(f.finalAmount),
    status: f.status,
    dueDate: f.dueDate
  }))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/fees/dashboard"
              className="group flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Fees Reports
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Generate comprehensive PDF reports for fees management</p>
            </div>
          </div>
          <DateRangePicker />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{students.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                <Users size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Courses</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{courses.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <BookOpen size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Report Types</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">4</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <FileText size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Billed Records</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{fees.length}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                <TrendingUp size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Data table section */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Fee Records in Selected Range</h2>
          <FeesReportTable data={feeData} />
        </div>

        {/* Report Types Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="group bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Monthly Report</h3>
                <p className="text-blue-100 text-xs">Fees for a specific month</p>
              </div>
            </div>
            <p className="text-blue-100/80 text-xs leading-relaxed">
              Generate detailed report showing all fees collected and pending for any month
            </p>
          </div>

          <div className="group bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Student Report</h3>
                <p className="text-emerald-100 text-xs">Individual student fees</p>
              </div>
            </div>
            <p className="text-emerald-100/80 text-xs leading-relaxed">
              Complete fee history and payment details for a specific student
            </p>
          </div>

          <div className="group bg-gradient-to-br from-purple-600 to-violet-700 p-6 rounded-3xl shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Course Report</h3>
                <p className="text-purple-100 text-xs">Fees by course</p>
              </div>
            </div>
            <p className="text-purple-100/80 text-xs leading-relaxed">
              Fee collection summary and details for all students in a course
            </p>
          </div>

          <div className="group bg-gradient-to-br from-amber-600 to-orange-700 p-6 rounded-3xl shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
                <Building size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Overall Report</h3>
                <p className="text-amber-100 text-xs">Complete institution</p>
              </div>
            </div>
            <p className="text-amber-100/80 text-xs leading-relaxed">
              Comprehensive report covering all fees, courses, and students
            </p>
          </div>
        </div>

        {/* Report Generator Component */}
        <ReportGenerator courses={courses} students={students} />
      </div>
    </div>
  )
}
