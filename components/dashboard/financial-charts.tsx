'use client'

import { useState, useEffect } from 'react'
import {
 ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
 PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { TrendingUp, DollarSign, Users, PieChart as PieIcon, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type FinancialData = {
 monthlyCollectionTrend: Array<{
 month: string
 dueAmount: number
 collectedAmount: number
 expenseAmount: number
 netIncome: number
 runningTotal: number
 newAdmissions: number
 }>
 expenseBreakdown: Array<{
 name: string
 category: string
 amount: number
 percentage: number
 }>
 totalExpensesOverall: number
 currentRunningTotal: number
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']

const formatPkr = (val: number) => `PKR ${val.toLocaleString()}`

export function FinancialCharts() {
 const [data, setData] = useState<FinancialData | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 async function loadData() {
 try {
 const res = await fetch('/api/admin/financial-analytics')
 if (res.ok) {
 const json = await res.json()
 setData(json)
 }
 } catch (err) {
 console.error('Failed to load financial analytics:', err)
 } finally {
 setLoading(false)
 }
 }
 loadData()
 }, [])

 if (loading) {
 return (
 <div className="flex h-64 items-center justify-center rounded-3xl border border-border bg-card p-8 shadow-sm">
 <div className="flex items-center gap-3 text-muted-foreground ">
 <Loader2 size={24} className="animate-spin text-indigo-600 dark:text-indigo-400" />
 <span className="text-sm font-medium">Loading financial charts & analytics...</span>
 </div>
 </div>
 )
 }

 if (!data) {
 return null
 }

 const { monthlyCollectionTrend, expenseBreakdown, currentRunningTotal } = data

 return (
 <div className="space-y-6">
 {/* Running Total Net Income Top Banner */}
 <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-6 text-white shadow-xl">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <div className="flex items-center gap-2 text-emerald-400">
 <TrendingUp size={18} />
 <span className="text-xs font-semibold uppercase tracking-widest">Net Income Running Total</span>
 </div>
 <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-white">
 {formatPkr(currentRunningTotal)}
 </h2>
 <p className="mt-1 text-xs text-emerald-200/80">
 Cumulative balance (Total Collections − Total Expenses across tracked period)
 </p>
 </div>
 <div className="flex items-center gap-2 rounded-2xl bg-card/10 px-4 py-3 backdrop-blur border border-white/15">
 {currentRunningTotal >= 0 ? (
 <ArrowUpRight className="h-6 w-6 text-emerald-400" />
 ) : (
 <ArrowDownRight className="h-6 w-6 text-rose-400" />
 )}
 <div>
 <p className="text-[11px] uppercase tracking-wider text-white/70">Financial Status</p>
 <p className="text-sm font-semibold text-white">
 {currentRunningTotal >= 0 ? 'Surplus / Net Positive' : 'Deficit / Net Negative'}
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Grid Row 1: Fee Collection Bar Chart & Expense Pie Chart */}
 <div className="grid gap-6 lg:grid-cols-12">
 {/* 1. Monthly Fee Collection Bar Chart */}
 <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
 Monthly Fee Collections vs Due
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
 Comparison of total billed fees vs actual collected amounts per month
 </p>
 </div>
 </div>

 <div className="h-72 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={monthlyCollectionTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
 <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `PKR ${(v / 1000).toFixed(0)}k`} />
 <Tooltip
 formatter={(val: number | string | Array<number | string> | undefined) => [formatPkr(Number(val || 0)), '']}
 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
 />
 <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
 <Bar dataKey="dueAmount" name="Billed / Due" fill="#6366f1" radius={[6, 6, 0, 0]} />
 <Bar dataKey="collectedAmount" name="Collected" fill="#10b981" radius={[6, 6, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* 2. Expense Breakdown Pie Chart */}
 <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <PieIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
 Expense Breakdown
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
 Distribution of institute operational expenses by category
 </p>
 </div>
 </div>

 {expenseBreakdown.length > 0 ? (
 <div className="h-72 w-full flex items-center justify-center">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={expenseBreakdown}
 cx="50%"
 cy="45%"
 innerRadius={55}
 outerRadius={85}
 paddingAngle={4}
 dataKey="amount"
 nameKey="name"
 >
 {expenseBreakdown.map((_, idx) => (
 <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
 ))}
 </Pie>
 <Tooltip
 formatter={(val: number | string | Array<number | string> | undefined) => [formatPkr(Number(val || 0)), 'Amount']}
 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
 />
 <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
 No expense records found.
 </div>
 )}
 </div>
 </div>

 {/* Grid Row 2: Enrollment Trend & Net Income Running Total */}
 <div className="grid gap-6 lg:grid-cols-12">
 {/* 3. Enrollment Trend Line Chart */}
 <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
 Enrollment Trend (New Admissions)
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
 Monthly count of new student course enrollments
 </p>
 </div>
 </div>

 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={monthlyCollectionTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
 <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
 <Tooltip
 formatter={(val: number | string | Array<number | string> | undefined) => [`${val} Admissions`, 'New Students']}
 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
 />
 <Line type="monotone" dataKey="newAdmissions" stroke="#0284c7" strokeWidth={3} dot={{ r: 5, fill: '#0284c7' }} activeDot={{ r: 7 }} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* 4. Net Income Running Total Area Chart */}
 <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
 Net Income & Running Balance Trend
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
 Net monthly profit (Collections − Expenses) & cumulative running total
 </p>
 </div>
 </div>

 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={monthlyCollectionTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
 <defs>
 <linearGradient id="runningTotalGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
 <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
 <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `PKR ${(v / 1000).toFixed(0)}k`} />
 <Tooltip
 formatter={(val: number | string | Array<number | string> | undefined) => [formatPkr(Number(val || 0)), '']}
 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
 />
 <Legend iconType="circle" wrapperStyle={{ paddingTop: '5px', fontSize: '12px' }} />
 <Area type="monotone" dataKey="runningTotal" name="Running Total" stroke="#10b981" fillOpacity={1} fill="url(#runningTotalGrad)" strokeWidth={2.5} />
 <Line type="monotone" dataKey="netIncome" name="Monthly Net" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 </div>
 )
}
