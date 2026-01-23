// app/admin/fees/reports/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Calendar, Users, BookOpen, Building } from 'lucide-react'
import { ReportGenerator } from './report-generator'

export default async function FeesReportsPage() {
  // Fetch data for report options
  const [courses, students] = await Promise.all([
    prisma.course.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.student.findMany({
      select: { id: true, studentId: true, name: true, fatherName: true },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/fees/dashboard"
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Reports</h1>
          <p className="text-gray-500">Generate comprehensive PDF reports for fees management</p>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Monthly Report</h3>
              <p className="text-sm text-gray-600">Fees for a specific month</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Generate detailed report showing all fees collected and pending for any month
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 text-green-700 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Student Report</h3>
              <p className="text-sm text-gray-600">Individual student fees</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Complete fee history and payment details for a specific student
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Course Report</h3>
              <p className="text-sm text-gray-600">Fees by course</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Fee collection summary and details for all students in a course
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 text-orange-700 rounded-lg">
              <Building size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Overall Report</h3>
              <p className="text-sm text-gray-600">Complete institution</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Comprehensive report covering all fees, courses, and students
          </p>
        </div>
      </div>

      {/* Report Generator Component */}
      <ReportGenerator courses={courses} students={students} />
    </div>
  )
}