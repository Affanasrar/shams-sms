// app/admin/fees/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Users, DollarSign, Percent, ArrowRight } from 'lucide-react'
import { FeesDashboard } from './fees-dashboard'

type SummaryData = {
 activeStudents: number
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
 <Link href="/admin" className="rounded-full border border-white/15 p-2 text-white/80 transition hover:bg-card/10 hover:text-white">
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
 <div className="space-y-6 max-w-full overflow-x-hidden">
 <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
 <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
 <div className="max-w-2xl space-y-4">
 <div className="flex items-center gap-3 text-white/75">
 <Link href="/admin" className="rounded-full border border-white/15 p-2 transition hover:bg-card/10 hover:text-white">
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
 className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
 >
 <DollarSign size={16} />
 Collect Fees
 </Link>
 <Link
 href="/admin/fees/discounts"
 className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-card/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-card/10"
 >
 <Percent size={16} />
 Manage Discounts
 </Link>
 <Link
 href="/admin/fees/reports"
 className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-card/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-card/10"
 >
 <FileText size={16} />
 Reports
 </Link>
 </div>
 </div>

 <div className="grid gap-3 grid-cols-2 w-full lg:w-auto">
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Active Students</p>
 <p className="mt-2 text-3xl font-semibold">{summaryData.activeStudents}</p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Collection Rate</p>
 <p className="mt-2 text-3xl font-semibold">{summaryData.collectionRate.toFixed(1)}%</p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Pending This Month</p>
 <p className="mt-2 text-2xl font-semibold text-rose-300">PKR {summaryData.pendingAmount.toLocaleString()}</p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Overdue Fees</p>
 <p className="mt-2 text-2xl font-semibold text-amber-300">{summaryData.overdueFeesCount}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
 <div className="card-surface p-4 ">
 <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground ">Fees this month</p>
 <div className="mt-2 flex items-end justify-between gap-2">
 <p className="text-xl font-bold text-foreground ">PKR {summaryData.totalFeesThisMonth.toLocaleString()}</p>
 <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
 </div>
 </div>
 <div className="card-surface p-4 ">
 <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground ">Collected this month</p>
 <div className="mt-2 flex items-end justify-between gap-2">
 <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">PKR {summaryData.paidFeesThisMonth.toLocaleString()}</p>
 <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
 </div>
 </div>
 <div className="card-surface p-4 ">
 <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground ">Pending students</p>
 <div className="mt-2 flex items-end justify-between gap-2">
 <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{summaryData.studentsWithPendingFeesCount}</p>
 <Users className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
 </div>
 </div>
 <div className="card-surface p-4 ">
 <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground ">Overdue fees</p>
 <div className="mt-2 flex items-end justify-between gap-2">
 <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{summaryData.overdueFeesCount}</p>
 <DollarSign className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
 </div>
 </div>
 <Link href="/admin/fees/discounts" className="group card-surface p-4 transition hover:-translate-y-0.5 col-span-2 sm:col-span-1">
 <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground ">Discounts</p>
 <div className="mt-2 flex items-end justify-between gap-2">
 <p className="text-sm font-bold text-foreground ">Manage discounts</p>
 <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 shrink-0" />
 </div>
 </Link>
 </div>

 <FeesDashboard courses={summaryData.courses} />
 </div>
 )
}