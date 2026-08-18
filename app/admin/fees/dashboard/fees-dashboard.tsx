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
 const [currentPage, setCurrentPage] = useState(1)
 const pageSize = 25

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
 PAID: 'bg-green-100 text-green-800 dark:text-green-300',
 PARTIAL: 'bg-yellow-100 text-yellow-800 dark:text-yellow-300',
 UNPAID: 'bg-red-100 text-red-800 dark:text-red-300'
 }
 return colors[status as keyof typeof colors] || 'bg-muted text-foreground'
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
 <div className="rounded-3xl border bg-card p-5 shadow-sm">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
 <Sparkles size={14} />
 Filters
 </div>
 <h3 className="text-lg font-semibold text-foreground">Refine the view</h3>
 <p className="text-sm text-muted-foreground">Use a month or a custom range, then narrow it by course, status, or student.</p>
 </div>

 <div className="flex flex-wrap gap-2">
 <button onClick={handleExportReport} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
 <Download size={16} />
 Export Report
 </button>
 <button onClick={handleClearFilters} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
 <X size={16} />
 Clear
 </button>
 </div>
 </div>

 <div className="mt-6 space-y-5">
 <div className="flex flex-wrap gap-4 rounded-2xl bg-muted p-3">
 <label className="flex items-center gap-2 text-sm font-medium text-foreground">
 <input
 type="radio"
 checked={!useCustomDateRange}
 onChange={() => setUseCustomDateRange(false)}
 className="h-4 w-4"
 />
 Month / Year
 </label>
 <label className="flex items-center gap-2 text-sm font-medium text-foreground">
 <input
 type="radio"
 checked={useCustomDateRange}
 onChange={() => setUseCustomDateRange(true)}
 className="h-4 w-4"
 />
 Custom Date Range
 </label>
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {!useCustomDateRange ? (
 <>
 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">Month</label>
 <select
 value={selectedMonth}
 onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
 className="w-full rounded-xl border border-border bg-card px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
 >
 {months.map((month, index) => (
 <option key={index + 1} value={index + 1}>{month}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">Year</label>
 <select
 value={selectedYear}
 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
 className="w-full rounded-xl border border-border bg-card px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
 <label className="mb-1 block text-sm font-medium text-foreground">Start Date</label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="w-full rounded-xl border border-border bg-card px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
 />
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">End Date</label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="w-full rounded-xl border border-border bg-card px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
 />
 </div>
 </>
 )}

 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">Status</label>
 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="w-full rounded-xl border border-border bg-card px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
 >
 <option value="">All Statuses</option>
 <option value="PAID">Paid</option>
 <option value="PARTIAL">Partial</option>
 <option value="UNPAID">Unpaid</option>
 </select>
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">Course</label>
 <select
 value={selectedCourse}
 onChange={(e) => setSelectedCourse(e.target.value)}
 className="w-full rounded-xl border border-border bg-card px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
 >
 <option value="">All Courses</option>
 {courses.map(course => (
 <option key={course.id} value={course.id}>{course.name}</option>
 ))}
 </select>
 </div>
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">Search Student</label>
 <div className="flex flex-col gap-2 md:flex-row">
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Student name or ID..."
 className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
 <div className="rounded-2xl border bg-card p-5 shadow-sm">
 <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Total Fees</p>
 <div className="mt-2 flex items-end justify-between gap-4">
 <p className="text-2xl font-semibold text-foreground">PKR {totalFees.toLocaleString()}</p>
 <CalendarIcon className="h-6 w-6 text-sky-600 dark:text-sky-300" />
 </div>
 </div>
 <div className="rounded-2xl border bg-card p-5 shadow-sm">
 <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Collected</p>
 <div className="mt-2 flex items-end justify-between gap-4">
 <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">PKR {totalPaid.toLocaleString()}</p>
 <Download className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
 </div>
 </div>
 <div className="rounded-2xl border bg-card p-5 shadow-sm">
 <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Pending</p>
 <div className="mt-2 flex items-end justify-between gap-4">
 <p className="text-2xl font-semibold text-rose-600 dark:text-rose-300">PKR {totalPending.toLocaleString()}</p>
 <Filter className="h-6 w-6 text-rose-600 dark:text-rose-300" />
 </div>
 </div>
 <div className="rounded-2xl border bg-card p-5 shadow-sm">
 <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Collection %</p>
 <div className="mt-2 flex items-end justify-between gap-4">
 <p className="text-2xl font-semibold text-violet-600">{collectionPercentage}%</p>
 <div className="rounded-full bg-violet-50 px-2 py-1 text-sm font-semibold text-violet-600">%</div>
 </div>
 </div>
 </div>

 <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
 <div className="flex flex-col gap-3 border-b bg-muted px-6 py-4 md:flex-row md:items-center md:justify-between">
 <div>
 <h3 className="font-semibold text-foreground">
 Student Fees - {months[selectedMonth - 1]} {selectedYear}
 </h3>
 <p className="text-sm text-muted-foreground">
 Showing {feesData.length} student{feesData.length !== 1 ? 's' : ''} with fee activity in the selected range.
 </p>
 </div>
 <div className="text-sm text-muted-foreground">
 {totalStudentsWithPendingFees} pending, {paidStudents} paid, {partialStudents} partial, {unpaidStudents} unpaid
 </div>
 </div>

 {loading ? (
 <div className="p-8 text-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
 <p className="text-muted-foreground mt-2">Loading fees data...</p>
 </div>
 ) : (
 <>
 <div className="w-full">
 <table className="w-full text-xs text-left">
 <thead className="bg-muted border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
 <tr>
 <th className="px-3.5 py-3">Student Info</th>
 <th className="px-3.5 py-3">Courses & Timings</th>
 <th className="px-3.5 py-3 whitespace-nowrap">Due Date</th>
 <th className="px-3.5 py-3">Financials</th>
 <th className="px-3.5 py-3 whitespace-nowrap">Status</th>
 <th className="px-3.5 py-3 text-right whitespace-nowrap">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
 {feesData.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((fee, index) => (
 <tr key={`${fee.studentId}-${index}`} className="hover:bg-muted transition">
 {/* Student Info */}
 <td className="px-3.5 py-3">
 <div className="flex items-center gap-2">
 <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
 {fee.studentId}
 </span>
 <span className="font-semibold text-foreground ">{fee.studentName}</span>
 </div>
 <div className="text-[11px] text-muted-foreground mt-0.5">s/o {fee.fatherName}</div>
 </td>

 {/* Courses & Timings */}
 <td className="px-3.5 py-3">
 <div className="flex flex-wrap items-center gap-1.5">
 {fee.courses.map((course) => (
 <span key={course.id} className="text-[11px] bg-muted text-foreground px-2 py-0.5 rounded-md font-medium border border-border ">
 {course.name}
 </span>
 ))}
 {fee.timingSlots.map((slot) => (
 <span key={slot} className="text-[11px] text-muted-foreground ">
 • {slot}
 </span>
 ))}
 </div>
 </td>

 {/* Due Date */}
 <td className="px-3.5 py-3 font-medium text-foreground whitespace-nowrap">
 {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
 </td>

 {/* Financial Summary */}
 <td className="px-3.5 py-3">
 <div className="font-mono text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
 <span className="font-semibold text-foreground ">PKR {fee.totalAmount.toLocaleString()}</span>
 {fee.paidAmount > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Paid: {fee.paidAmount.toLocaleString()}</span>}
 {fee.pendingAmount > 0 && <span className="text-rose-600 dark:text-rose-400 font-semibold">Due: {fee.pendingAmount.toLocaleString()}</span>}
 </div>
 </td>

 {/* Status */}
 <td className="px-3.5 py-3 whitespace-nowrap">
 <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadge(fee.status)}`}>
 {fee.status}
 </span>
 </td>

 {/* Action */}
 <td className="px-3.5 py-3 text-right whitespace-nowrap">
 <a
 href={`/admin/fees?studentId=${fee.studentDbId}`}
 className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition font-semibold text-xs shadow-sm"
 >
 Collect Fee
 </a>
 </td>
 </tr>
 ))}

 {feesData.length === 0 && (
 <tr>
 <td colSpan={6} className="p-8 text-center text-muted-foreground ">
 No fees data found for the selected filters.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination Controls */}
 {feesData.length > 0 && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border px-6 py-4 text-sm text-muted-foreground ">
 <div>
 Showing <span className="font-semibold text-foreground ">{(currentPage - 1) * pageSize + 1}</span> to{' '}
 <span className="font-semibold text-foreground ">{Math.min(currentPage * pageSize, feesData.length)}</span> of{' '}
 <span className="font-semibold text-foreground ">{feesData.length}</span> students
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 text-xs font-medium transition hover:bg-muted"
 >
 Previous
 </button>
 <span className="text-xs font-medium px-2 text-foreground ">
 Page {currentPage} of {Math.ceil(feesData.length / pageSize)}
 </span>
 <button
 onClick={() => setCurrentPage(p => Math.min(Math.ceil(feesData.length / pageSize), p + 1))}
 disabled={currentPage >= Math.ceil(feesData.length / pageSize)}
 className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 text-xs font-medium transition hover:bg-muted"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </>
 )}
 </div>
 </div>
 )
}