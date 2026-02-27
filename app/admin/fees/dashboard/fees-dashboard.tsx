// app/admin/fees/dashboard/fees-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Search, Filter, Download, X } from 'lucide-react'

type Course = {
  id: string
  name: string
}

type StudentFees = {
  studentId: string
  studentDbId: string
  studentName: string
  fatherName: string
  courses: { id: string; name: string }[]
  dueDate: string | null
  month: string
  year: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  status: string
  lastPayment?: string
  daysOverdue?: number
}

type Props = {
  courses: Course[]
}

export function FeesDashboard({ courses }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [feesData, setFeesData] = useState<StudentFees[]>([])
  const [loading, setLoading] = useState(false)
  const [useCustomDateRange, setUseCustomDateRange] = useState(false)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const fetchFeesData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (useCustomDateRange && startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      } else {
        params.append('month', selectedMonth.toString())
        params.append('year', selectedYear.toString())
      }
      
      if (selectedCourse) params.append('courseId', selectedCourse)
      if (selectedStatus) params.append('status', selectedStatus)
      if (searchTerm) params.append('search', searchTerm)

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
  }, [selectedMonth, selectedYear, selectedCourse, selectedStatus, useCustomDateRange, searchTerm, startDate, endDate])

  const handleSearch = () => {
    fetchFeesData()
  }

  const handleClearFilters = () => {
    setSelectedMonth(new Date().getMonth() + 1)
    setSelectedYear(new Date().getFullYear())
    setSelectedCourse('')
    setSelectedStatus('')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setUseCustomDateRange(false)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      UNPAID: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const handleExportReport = () => {
    // Generate monthly report for current filters
    const params = new URLSearchParams({
      type: 'monthly',
      month: selectedMonth.toString(),
      year: selectedYear.toString()
    })

    if (selectedCourse) {
      params.append('courseId', selectedCourse)
    }

    window.open(`/api/admin/fees/reports/generate?${params}`, '_blank')
  }

  // Calculate summary statistics
  const totalFees = feesData.reduce((sum, fee) => sum + fee.totalAmount, 0)
  const totalPaid = feesData.reduce((sum, fee) => sum + fee.paidAmount, 0)
  const totalPending = feesData.reduce((sum, fee) => sum + fee.pendingAmount, 0)
  const totalStudentsWithPendingFees = feesData.filter(f => f.pendingAmount > 0).length
  const paidStudents = feesData.filter(f => f.status === 'PAID').length
  const partialStudents = feesData.filter(f => f.status === 'PARTIAL').length
  const unpaidStudents = feesData.filter(f => f.status === 'UNPAID').length
  const collectionPercentage = totalFees > 0 ? ((totalPaid / totalFees) * 100).toFixed(2) : 0
  const overdueCount = feesData.filter(f => {
    const dueDate = new Date(f.lastPayment || new Date())
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return f.pendingAmount > 0 && dueDate < thirtyDaysAgo
  }).length

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="space-y-4">
          {/* Filter Mode Selection */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!useCustomDateRange}
                onChange={() => setUseCustomDateRange(false)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Month/Year</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={useCustomDateRange}
                onChange={() => setUseCustomDateRange(true)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Custom Date Range</span>
            </label>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {!useCustomDateRange ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
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
          </div>

          {/* Search Bar */}
          <div>
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
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Search size={16} />
                Search
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 flex items-center gap-2"
              >
                <X size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary for filtered data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Fees</p>
              <p className="text-lg font-bold text-gray-900">PKR {totalFees.toLocaleString()}</p>
            </div>
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Collected</p>
              <p className="text-lg font-bold text-green-600">PKR {totalPaid.toLocaleString()}</p>
            </div>
            <Download className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Pending</p>
              <p className="text-lg font-bold text-red-600">PKR {totalPending.toLocaleString()}</p>
            </div>
            <Filter className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Collection %</p>
              <p className="text-lg font-bold text-purple-600">{collectionPercentage}%</p>
            </div>
            <div className="h-6 w-6 text-purple-600 font-bold">%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Pending Students</p>
              <p className="text-lg font-bold text-orange-600">{totalStudentsWithPendingFees}</p>
            </div>
            <Filter className="h-6 w-6 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Overdue (30+ days)</p>
              <p className="text-lg font-bold text-red-700">{overdueCount}</p>
            </div>
            <Filter className="h-6 w-6 text-red-700" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
          <p className="text-sm font-medium text-green-700">Paid</p>
          <p className="text-2xl font-bold text-green-600">{paidStudents}</p>
          <p className="text-xs text-gray-600 mt-1">Students with full payment</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm">
          <p className="text-sm font-medium text-yellow-700">Partial</p>
          <p className="text-2xl font-bold text-yellow-600">{partialStudents}</p>
          <p className="text-xs text-gray-600 mt-1">Students with partial payment</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
          <p className="text-sm font-medium text-red-700">Unpaid</p>
          <p className="text-2xl font-bold text-red-600">{unpaidStudents}</p>
          <p className="text-xs text-gray-600 mt-1">Students with no payment</p>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            Student Fees - {months[selectedMonth - 1]} {selectedYear}
          </h3>
          <button 
            onClick={handleExportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
          >
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
                  <th className="px-6 py-3">Courses</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Paid Amount</th>
                  <th className="px-6 py-3">Pending Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
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
                      <div className="flex flex-col gap-1">
                        {fee.courses.length > 2 ? (
                          <>
                            {fee.courses.slice(0, 2).map((course) => (
                              <div key={course.id} className="text-xs bg-blue-50 px-2 py-1 rounded">
                                {course.name}
                              </div>
                            ))}
                            <div className="text-xs font-semibold text-blue-600">
                              +{fee.courses.length - 2} more
                            </div>
                          </>
                        ) : (
                          fee.courses.map((course) => (
                            <div key={course.id} className="text-xs bg-blue-50 px-2 py-1 rounded">
                              {course.name}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-red-600">
                      {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}
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
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/admin/fees?studentId=${fee.studentDbId}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium text-xs inline-block"
                      >
                        Collect Fee
                      </a>
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