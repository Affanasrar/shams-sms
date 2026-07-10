// app/admin/fees/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Users, DollarSign, Percent, ArrowRight } from 'lucide-react'
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
        <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="rounded-full border border-white/15 p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/55">Fees</p>
                <h1 className="text-3xl font-semibold">Fee Dashboard</h1>
                <p className="text-sm text-white/70">Loading overview...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-white/75">
              <Link href="/admin" className="rounded-full border border-white/15 p-2 transition hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <span className="text-xs uppercase tracking-[0.3em]">Fees control center</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Fee Dashboard</h1>
              <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
                Keep collections, discounts, and overdue balances in one place without the clutter.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/fees"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <DollarSign size={16} />
                Collect Fees
              </Link>
              <Link
                href="/admin/fees/discounts"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Percent size={16} />
                Manage Discounts
              </Link>
              <Link
                href="/admin/fees/reports"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <FileText size={16} />
                Reports
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[32rem] xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Total Students</p>
              <p className="mt-2 text-3xl font-semibold">{summaryData.totalStudents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Collection Rate</p>
              <p className="mt-2 text-3xl font-semibold">{summaryData.collectionRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Pending This Month</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">PKR {summaryData.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Overdue Fees</p>
              <p className="mt-2 text-2xl font-semibold text-amber-300">{summaryData.overdueFeesCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Fees this month</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-slate-900">PKR {summaryData.totalFeesThisMonth.toLocaleString()}</p>
            <Calendar className="h-6 w-6 text-sky-600" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Collected this month</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-emerald-600">PKR {summaryData.paidFeesThisMonth.toLocaleString()}</p>
            <DollarSign className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Pending students</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-orange-600">{summaryData.studentsWithPendingFeesCount}</p>
            <Users className="h-6 w-6 text-orange-600" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Overdue fees</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold text-rose-600">{summaryData.overdueFeesCount}</p>
            <DollarSign className="h-6 w-6 text-rose-600" />
          </div>
        </div>
        <Link href="/admin/fees/discounts" className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Discounts</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-lg font-semibold text-slate-900">Manage student discounts</p>
            <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      <FeesDashboard courses={summaryData.courses} />
    </div>
  )
}