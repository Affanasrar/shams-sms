// app/admin/fees/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Calendar, Users, DollarSign } from 'lucide-react'
import { FeesDashboard } from './fees-dashboard'

type SummaryData = {
  totalStudents: number
  totalFeesThisMonth: number
  paidFeesThisMonth: number
  pendingAmount: number
  overdueFeesCount: number
  studentsWithPendingFeesCount: number
  collectionRate: number
  courses: Array<{ id: string; name: string }>
}

export default function FeesDashboardPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('/api/admin/fees/summary')
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch fees summary:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummaryData()

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchSummaryData, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading || !summaryData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fees Dashboard</h1>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fees Dashboard</h1>
            <p className="text-gray-500">Comprehensive fees management and reporting</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/fees"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <DollarSign size={16} />
            Collect Fees
          </Link>
          <Link
            href="/admin/fees/reports"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <FileText size={16} />
            Generate Reports
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{summaryData.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fees This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                PKR {summaryData.totalFeesThisMonth.toLocaleString()}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collected This Month</p>
              <p className="text-2xl font-bold text-green-600">
                PKR {summaryData.paidFeesThisMonth.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending This Month</p>
              <p className="text-2xl font-bold text-red-600">
                PKR {summaryData.pendingAmount.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students with Pending Fees</p>
              <p className="text-2xl font-bold text-orange-600">
                {summaryData.studentsWithPendingFeesCount}
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Fees (30+ days)</p>
              <p className="text-2xl font-bold text-red-700">
                {summaryData.overdueFeesCount}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-red-700" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {summaryData.collectionRate.toFixed(2)}%
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Main Dashboard Component */}
      <FeesDashboard courses={summaryData.courses} />
    </div>
  )
}