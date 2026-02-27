// app/admin/fees/reports/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Users, BookOpen, Building, TrendingUp } from 'lucide-react'
import { ReportGenerator } from './report-generator'
import { DateRangePicker } from '../../../../components/ui/date-range-picker'
import { FeesReportTable, FeeRow } from '@/components/fees/fees-report-table'
import { subDays } from 'date-fns'

interface ReportsPageProps {
  searchParams: { start?: string; end?: string }
}

export default async function FeesReportsPage({ searchParams }: ReportsPageProps) {
  // determine date range, default last 30 days
  const now = new Date()
  const startDate = searchParams.start ? new Date(searchParams.start) : subDays(now, 30)
  const endDate = searchParams.end ? new Date(searchParams.end) : now
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/fees/dashboard"
              className="group flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft size={20} className="text-gray-600 group-hover:text-gray-900 transition-colors" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Fees Reports
              </h1>
              <p className="text-gray-600 mt-1">Generate comprehensive PDF reports for fees management</p>
            </div>
          </div>
          <DateRangePicker />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Report Types</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FileText size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Generated Today</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Data table section */}
        <div className="mb-8">
          <FeesReportTable data={feeData} />
        </div>

        {/* Report Types Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Monthly Report</h3>
                <p className="text-blue-100 text-sm">Fees for a specific month</p>
              </div>
            </div>
            <p className="text-blue-50 text-sm leading-relaxed">
              Generate detailed report showing all fees collected and pending for any month
            </p>
          </div>

          <div className="group bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Student Report</h3>
                <p className="text-green-100 text-sm">Individual student fees</p>
              </div>
            </div>
            <p className="text-green-50 text-sm leading-relaxed">
              Complete fee history and payment details for a specific student
            </p>
          </div>

          <div className="group bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BookOpen size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Course Report</h3>
                <p className="text-purple-100 text-small">Fees by course</p>
              </div>
            </div>
            <p className="text-purple-50 text-sm leading-relaxed">
              Fee collection summary and details for all students in a course
            </p>
          </div>

          <div className="group bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Building size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Overall Report</h3>
                <p className="text-orange-100 text-sm">Complete institution</p>
              </div>
            </div>
            <p className="text-orange-50 text-sm leading-relaxed">
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
