// app/admin/fees/reports/report-generator.tsx
'use client'

import { useState } from 'react'
import { FileText, Download, Calendar, Users, BookOpen, Building, Loader } from 'lucide-react'

type Course = {
  id: string
  name: string
}

type Student = {
  id: string
  studentId: string
  name: string
  fatherName: string
}

type Props = {
  courses: Course[]
  students: Student[]
}

export function ReportGenerator({ courses, students }: Props) {
  const [reportType, setReportType] = useState<'monthly' | 'student' | 'course' | 'overall'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [generating, setGenerating] = useState(false)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      })

      if (reportType === 'student' && selectedStudent) {
        params.append('studentId', selectedStudent)
      }

      if (reportType === 'course' && selectedCourse) {
        params.append('courseId', selectedCourse)
      }

      // Open PDF in new tab
      window.open(`/api/admin/fees/reports/generate?${params}`, '_blank')
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    }
    setGenerating(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                value="monthly"
                checked={reportType === 'monthly'}
                onChange={(e) => setReportType(e.target.value as any)}
                className="mr-2"
              />
              <Calendar size={16} className="mr-2 text-blue-600" />
              Monthly Report
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                value="student"
                checked={reportType === 'student'}
                onChange={(e) => setReportType(e.target.value as any)}
                className="mr-2"
              />
              <Users size={16} className="mr-2 text-green-600" />
              Student Report
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                value="course"
                checked={reportType === 'course'}
                onChange={(e) => setReportType(e.target.value as any)}
                className="mr-2"
              />
              <BookOpen size={16} className="mr-2 text-purple-600" />
              Course Report
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reportType"
                value="overall"
                checked={reportType === 'overall'}
                onChange={(e) => setReportType(e.target.value as any)}
                className="mr-2"
              />
              <Building size={16} className="mr-2 text-orange-600" />
              Overall Report
            </label>
          </div>
        </div>

        {/* Date Selection */}
        {(reportType === 'monthly' || reportType === 'course' || reportType === 'overall') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month & Year</label>
            <div className="space-y-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Student Selection */}
        {reportType === 'student' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.studentId}>
                  {student.studentId} - {student.name} (s/o {student.fatherName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Course Selection */}
        {reportType === 'course' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a course...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-end">
          <button
            onClick={handleGenerateReport}
            disabled={generating || (reportType === 'student' && !selectedStudent) || (reportType === 'course' && !selectedCourse)}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={16} />
                Generate PDF Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Preview Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Report Contents:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          {reportType === 'monthly' && (
            <>
              <p>• Complete fee collection summary for {months[selectedMonth - 1]} {selectedYear}</p>
              <p>• Student-wise fee details with payment status</p>
              <p>• Total collected vs pending amounts</p>
              <p>• Payment transaction history</p>
            </>
          )}
          {reportType === 'student' && (
            <>
              <p>• Complete fee history for selected student</p>
              <p>• Monthly fee breakdown with payment dates</p>
              <p>• Outstanding balances and due dates</p>
              <p>• Payment transaction details</p>
            </>
          )}
          {reportType === 'course' && (
            <>
              <p>• Fee collection summary for selected course</p>
              <p>• All enrolled students' fee status</p>
              <p>• Course-wise financial overview</p>
              <p>• Payment trends and analytics</p>
            </>
          )}
          {reportType === 'overall' && (
            <>
              <p>• Complete institutional fee overview</p>
              <p>• All courses and students summary</p>
              <p>• Financial performance metrics</p>
              <p>• Comprehensive payment analytics</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}