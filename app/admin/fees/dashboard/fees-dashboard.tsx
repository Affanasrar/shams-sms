// app/admin/fees/dashboard/fees-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Search, Filter, Download, X, Sparkles } from 'lucide-react'

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
  timingSlots: string[]
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
      return response.json() as Promise<StudentFees[]>
    }

    throw new Error('Failed to fetch fees data')
  }

  useEffect(() => {
    let cancelled = false

    const loadFeesData = async () => {
      setLoading(true)
      try {
        const data = await fetchFeesData()
        if (!cancelled) {
          setFeesData(data)
        }
      } catch (error) {
        console.error('Failed to fetch fees data:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFeesData()

    const interval = setInterval(loadFeesData, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [selectedMonth, selectedYear, selectedCourse, selectedStatus, useCustomDateRange, searchTerm, startDate, endDate])

  const handleSearch = () => {
    void fetchFeesData()
      .then(setFeesData)
      .catch(error => console.error('Failed to fetch fees data:', error))
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
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
              <Sparkles size={14} />
              Filters
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Refine the view</h3>
            <p className="text-sm text-slate-500">Use a month or a custom range, then narrow it by course, status, or student.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportReport} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              <Download size={16} />
              Export Report
            </button>
            <button onClick={handleClearFilters} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              <X size={16} />
              Clear
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-4 rounded-2xl bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="radio"
                checked={!useCustomDateRange}
                onChange={() => setUseCustomDateRange(false)}
                className="h-4 w-4"
              />
              Month / Year
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="radio"
                checked={useCustomDateRange}
                onChange={() => setUseCustomDateRange(true)}
                className="h-4 w-4"
              />
              Custom Date Range
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {!useCustomDateRange ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {months.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Search Student</label>
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Student name or ID..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Search size={16} />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Total Fees</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-slate-900">PKR {totalFees.toLocaleString()}</p>
            <CalendarIcon className="h-6 w-6 text-sky-600" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Collected</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-emerald-600">PKR {totalPaid.toLocaleString()}</p>
            <Download className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Pending</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-rose-600">PKR {totalPending.toLocaleString()}</p>
            <Filter className="h-6 w-6 text-rose-600" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Collection %</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-violet-600">{collectionPercentage}%</p>
            <div className="rounded-full bg-violet-50 px-2 py-1 text-sm font-semibold text-violet-600">%</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Student Fees - {months[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-sm text-slate-500">
              Showing {feesData.length} student{feesData.length !== 1 ? 's' : ''} with fee activity in the selected range.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            {totalStudentsWithPendingFees} pending, {paidStudents} paid, {partialStudents} partial, {unpaidStudents} unpaid
          </div>
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
                  <th className="px-6 py-3">Timing / Lab</th>
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
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex flex-col gap-1">
                        {fee.timingSlots.length > 1 ? (
                          <>
                            {fee.timingSlots.slice(0, 2).map((slot) => (
                              <div key={slot} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                                {slot}
                              </div>
                            ))}
                            <div className="text-xs font-semibold text-slate-600">
                              +{fee.timingSlots.length - 2} more
                            </div>
                          </>
                        ) : (
                          fee.timingSlots.map((slot) => (
                            <div key={slot} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                              {slot}
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
                    <td colSpan={10} className="p-8 text-center text-gray-500">
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