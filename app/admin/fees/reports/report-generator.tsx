// app/admin/fees/reports/report-generator.tsx
'use client'

import { useState } from 'react'
import { FileText, Download, Calendar, Users, BookOpen, Building, Loader, CheckCircle, Sparkles } from 'lucide-react'

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
  const [generated, setGenerated] = useState(false)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const handleGenerateReport = async () => {
    setGenerating(true)
    setGenerated(false)
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

      // Show success state
      setTimeout(() => {
        setGenerating(false)
        setGenerated(true)
        setTimeout(() => setGenerated(false), 3000)
      }, 1000)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
      setGenerating(false)
    }
  }

  const reportTypeOptions = [
    {
      id: 'monthly' as const,
      label: 'Monthly Report',
      icon: Calendar,
      color: 'blue',
      description: 'Fees for a specific month'
    },
    {
      id: 'student' as const,
      label: 'Student Report',
      icon: Users,
      color: 'green',
      description: 'Individual student fees'
    },
    {
      id: 'course' as const,
      label: 'Course Report',
      icon: BookOpen,
      color: 'purple',
      description: 'Fees by course'
    },
    {
      id: 'overall' as const,
      label: 'Overall Report',
      icon: Building,
      color: 'orange',
      description: 'Complete institution'
    }
  ]

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Generate Report</h2>
            <p className="text-indigo-100">Create professional PDF reports instantly</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Type Selection */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Type</h3>
            <div className="space-y-3">
              {reportTypeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = reportType === option.id
                return (
                  <label
                    key={option.id}
                    className={`group flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={option.id}
                      checked={isSelected}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-xl mr-4 transition-all duration-300 ${
                      isSelected
                        ? `bg-${option.color}-500 text-white`
                        : `bg-${option.color}-100 text-${option.color}-600 group-hover:bg-${option.color}-200`
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold transition-colors ${
                        isSelected ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </h4>
                      <p className={`text-sm transition-colors ${
                        isSelected ? 'text-gray-600' : 'text-gray-500'
                      }`}>
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-4">
                        <div className={`w-4 h-4 rounded-full bg-${option.color}-500 flex items-center justify-center`}>
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              {(reportType === 'monthly' || reportType === 'course' || reportType === 'overall') && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Month & Year</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                    >
                      {months.map((month, index) => (
                        <option key={index + 1} value={index + 1}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
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
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Select Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
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
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Select Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
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
                  className={`w-full px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    generating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : generated
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  {generating ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Generating PDF...
                    </>
                  ) : generated ? (
                    <>
                      <CheckCircle size={20} />
                      Report Generated!
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Generate PDF Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Preview Info */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={20} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Report Contents Preview</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            {reportType === 'monthly' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Complete fee collection summary for {months[selectedMonth - 1]} {selectedYear}</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Student-wise fee details with payment status</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Total collected vs pending amounts</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Payment transaction history</p>
                </div>
              </div>
            )}
            {reportType === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Complete fee history for selected student</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Monthly fee breakdown with payment dates</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Outstanding balances and due dates</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Payment transaction details</p>
                </div>
              </div>
            )}
            {reportType === 'course' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span>Fee collection summary for selected course</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span>All enrolled students' fee status</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span>Course-wise financial overview</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span>Payment trends and analytics</p>
                </div>
              </div>
            )}
            {reportType === 'overall' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>Complete institutional fee overview</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>All courses and students summary</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>Financial performance metrics</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>Comprehensive payment analytics</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}