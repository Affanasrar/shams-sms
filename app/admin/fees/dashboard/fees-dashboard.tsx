// app/admin/fees/dashboard/fees-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Search, Filter, Download, Eye } from 'lucide-react'

type Course = {
  id: string
  name: string
}

type StudentFees = {
  studentId: string
  studentName: string
  fatherName: string
  courseName: string
  month: string
  year: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  status: string
  lastPayment?: string
}

type Props = {
  courses: Course[]
}

export function FeesDashboard({ courses }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCourse, setSelectedCourse] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [feesData, setFeesData] = useState<StudentFees[]>([])
  const [loading, setLoading] = useState(false)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const fetchFeesData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        courseId: selectedCourse,
        search: searchTerm
      })

      const response = await fetch(`/api/admin/fees/dashboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFeesData(data)
      }
    } catch (error) {
      console.error('Failed to fetch fees data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFeesData()
  }, [selectedMonth, selectedYear, selectedCourse])

  const handleSearch = () => {
    fetchFeesData()
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      UNPAID: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const totalFees = feesData.reduce((sum, fee) => sum + fee.totalAmount, 0)
  const totalPaid = feesData.reduce((sum, fee) => sum + fee.paidAmount, 0)
  const totalPending = feesData.reduce((sum, fee) => sum + fee.pendingAmount, 0)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {months.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Student name or ID..."
                className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary for filtered data */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Fees</p>
              <p className="text-xl font-bold text-gray-900">PKR {totalFees.toLocaleString()}</p>
            </div>
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Collected</p>
              <p className="text-xl font-bold text-green-600">PKR {totalPaid.toLocaleString()}</p>
            </div>
            <Download className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
              <p className="text-xl font-bold text-red-600">PKR {totalPending.toLocaleString()}</p>
            </div>
            <Filter className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            Student Fees - {months[selectedMonth - 1]} {selectedYear}
          </h3>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm">
            <Download size={16} />
            Export Report
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading fees data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-gray-600">
                <tr>
                  <th className="px-6 py-3">Student ID</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Paid Amount</th>
                  <th className="px-6 py-3">Pending Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Payment</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {feesData.map((fee, index) => (
                  <tr key={`${fee.studentId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-blue-600 font-medium">
                      {fee.studentId}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {fee.studentName}
                      <div className="text-xs text-gray-500">s/o {fee.fatherName}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {fee.courseName}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      PKR {fee.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-green-600">
                      PKR {fee.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-red-600">
                      PKR {fee.pendingAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(fee.status)}`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {fee.lastPayment || 'No payments'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 p-1">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {feesData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No fees data found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}