// app/admin/expenses/expenses-client.tsx
'use client'

import { useState, useEffect } from 'react'
import { createExpense, deleteExpense } from '@/app/actions/expenses'
import {
 DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Trash2,
 Receipt, ArrowUpRight, ArrowDownRight, X, Calendar, Filter, ChevronDown, ChevronRight
} from 'lucide-react'
import {
 BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
 PieChart as RechartsPieChart, Pie, Cell
} from 'recharts'

const CATEGORY_LABELS: Record<string, string> = {
 RENT: 'Rent', SALARY: 'Salary', UTILITIES: 'Utilities',
 SUPPLIES: 'Supplies', MAINTENANCE: 'Maintenance', MARKETING: 'Marketing', OTHER: 'Other',
}
const CATEGORY_COLORS: Record<string, string> = {
 RENT: '#ef4444', SALARY: '#3b82f6', UTILITIES: '#f59e0b',
 SUPPLIES: '#10b981', MAINTENANCE: '#8b5cf6', MARKETING: '#ec4899', OTHER: '#6b7280',
}
const CATEGORIES = Object.keys(CATEGORY_LABELS)

const MONTH_NAMES = [
 'January', 'February', 'March', 'April', 'May', 'June',
 'July', 'August', 'September', 'October', 'November', 'December'
]

type Expense = {
 id: string; title: string; amount: string; category: string
 date: string; description: string | null; createdById: string | null
}

type Summary = {
 totalExpenses: number; totalPrevExpenses: number; totalIncome: number
 netProfit: number; categoryBreakdown: Record<string, number>
 monthlyTrend: { month: string; expenses: number; income: number }[]
 expenseCount: number
}

type Props = { initialExpenses: Expense[]; initialSummary: Summary }

export default function ExpensesClient({ initialExpenses, initialSummary }: Props) {
 const currentDate = new Date()
 const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth())
 const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
 const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

 const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
 const [summary, setSummary] = useState<Summary>(initialSummary)
 const [loadingData, setLoadingData] = useState(false)

 const [showAddForm, setShowAddForm] = useState(false)
 const [loading, setLoading] = useState(false)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
 
 // Accordion expanded state for grouped view
 const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})

 // Fetch updated data whenever month, year or category changes
 useEffect(() => {
 const fetchMonthData = async () => {
 setLoadingData(true)
 try {
 const res = await fetch(`/api/admin/expenses?month=${selectedMonth}&year=${selectedYear}&category=${selectedCategory}`)
 if (res.ok) {
 const data = await res.json()
 setExpenses(data.expenses)
 setSummary(data.summary)
 }
 } catch (err) {
 console.error('Failed to load month expenses:', err)
 } finally {
 setLoadingData(false)
 }
 }

 fetchMonthData()
 }, [selectedMonth, selectedYear, selectedCategory])

 const expenseChange = summary.totalPrevExpenses > 0
 ? ((summary.totalExpenses - summary.totalPrevExpenses) / summary.totalPrevExpenses * 100).toFixed(1)
 : '0'

 const pieData = Object.entries(summary.categoryBreakdown).map(([key, value]) => ({
 name: CATEGORY_LABELS[key] || key, value, color: CATEGORY_COLORS[key] || '#6b7280',
 }))

 const handleAdd = async (formData: FormData) => {
 setLoading(true); setMessage(null)
 const result = await createExpense(null, formData)
 setLoading(false)
 if (result.success) {
 setShowAddForm(false);
 setMessage({ type: 'success', text: result.message || 'Added' })
 // Re-trigger current month fetch
 const res = await fetch(`/api/admin/expenses?month=${selectedMonth}&year=${selectedYear}&category=${selectedCategory}`)
 if (res.ok) {
 const data = await res.json()
 setExpenses(data.expenses)
 setSummary(data.summary)
 }
 } else {
 setMessage({ type: 'error', text: result.error || 'Failed' })
 }
 }

 const handleDelete = async (id: string) => {
 if (!confirm('Delete this expense?')) return
 setMessage(null)
 const fd = new FormData(); fd.set('expenseId', id)
 const result = await deleteExpense(fd)
 if (result.success) {
 setMessage({ type: 'success', text: result.message || 'Deleted' })
 const res = await fetch(`/api/admin/expenses?month=${selectedMonth}&year=${selectedYear}&category=${selectedCategory}`)
 if (res.ok) {
 const data = await res.json()
 setExpenses(data.expenses)
 setSummary(data.summary)
 }
 } else {
 setMessage({ type: 'error', text: result.error || 'Failed' })
 }
 }

 const formatCurrency = (n: number) => `PKR ${n.toLocaleString('en-PK')}`

 // Group current expenses by day or month for expanded view
 const groupedExpenses = expenses.reduce((acc, exp) => {
 const d = new Date(exp.date)
 const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
 if (!acc[monthKey]) acc[monthKey] = []
 acc[monthKey].push(exp)
 return acc
 }, {} as Record<string, Expense[]>)

 const toggleMonthExpand = (key: string) => {
 setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }))
 }

 const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <Receipt className="text-indigo-600 dark:text-indigo-400" size={28} />
 Expense Tracker
 </h1>
 <p className="text-sm text-muted-foreground mt-1">
 Track and analyze monthly institute expenses
 </p>
 </div>
 <button
 onClick={() => setShowAddForm(true)}
 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition shadow-sm"
 >
 <Plus size={16} /> Add Expense
 </button>
 </div>

 {message && (
 <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
 {message.text}
 </div>
 )}

 {/* Month & Year Selection Bar */}
 <div className="card-surface p-4 flex flex-col md:flex-row items-center justify-between gap-4 ">
 <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
 <div className="flex items-center gap-2 text-sm font-semibold text-foreground ">
 <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
 <span>Select Period:</span>
 </div>

 <select
 value={selectedMonth}
 onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
 className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-indigo-500 "
 >
 {MONTH_NAMES.map((m, idx) => (
 <option key={m} value={idx}>{m}</option>
 ))}
 </select>

 <select
 value={selectedYear}
 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
 className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-indigo-500 "
 >
 {years.map(y => (
 <option key={y} value={y}>{y}</option>
 ))}
 </select>

 <div className="flex items-center gap-2 ml-2">
 <Filter size={16} className="text-muted-foreground" />
 <select
 value={selectedCategory}
 onChange={(e) => setSelectedCategory(e.target.value)}
 className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-indigo-500 "
 >
 <option value="ALL">All Categories</option>
 {CATEGORIES.map(c => (
 <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800/40">
 Showing {MONTH_NAMES[selectedMonth]} {selectedYear}
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <SummaryCard title="Total Expenses" value={formatCurrency(summary.totalExpenses)} change={`${expenseChange}%`} isUp={Number(expenseChange) > 0} icon={<TrendingDown className="text-rose-500" size={20} />} color="rose" />
 <SummaryCard title="Total Income" value={formatCurrency(summary.totalIncome)} subtitle="From fee collections" icon={<TrendingUp className="text-emerald-500" size={20} />} color="emerald" />
 <SummaryCard title="Net Profit" value={formatCurrency(summary.netProfit)} subtitle="Income − Expenses" icon={<DollarSign className={summary.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'} size={20} />} color={summary.netProfit >= 0 ? 'emerald' : 'rose'} />
 <SummaryCard title="Expense Items" value={String(summary.expenseCount)} subtitle={`In ${MONTH_NAMES[selectedMonth]}`} icon={<PieChart className="text-indigo-500" size={20} />} color="indigo" />
 </div>

 {/* Charts Row */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
 {/* Income vs Expenses Bar Chart */}
 <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
 <div className="border-b border-border bg-muted px-5 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold text-foreground ">Income vs Expenses</h3>
 <p className="text-xs text-muted-foreground mt-0.5">Last 6 months — click a bar to jump to that month</p>
 </div>
 <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">6M Trend</span>
 </div>
 </div>
 <div className="p-5">
 <ResponsiveContainer width="100%" height={280}>
 <BarChart
 data={summary.monthlyTrend}
 onClick={(state: any) => {
 if (state && state.activePayload && state.activePayload.length > 0) {
 const monthStr = state.activePayload[0].payload.month
 const parts = monthStr.split(' ')
 if (parts.length === 2) {
 const mIdx = MONTH_NAMES.findIndex(m => m.startsWith(parts[0]))
 if (mIdx !== -1) setSelectedMonth(mIdx)
 setSelectedYear(parseInt(parts[1]))
 }
 }
 }}
 >
 <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.12} />
 <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
 <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
 <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
 <Legend wrapperStyle={{ fontSize: '12px' }} />
 <Bar dataKey="income" fill="#10b981" name="Income" radius={[6, 6, 0, 0]} cursor="pointer" />
 <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" radius={[6, 6, 0, 0]} cursor="pointer" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Category Breakdown Pie Chart */}
 <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
 <div className="border-b border-border bg-muted px-5 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold text-foreground ">Expense Breakdown</h3>
 <p className="text-xs text-muted-foreground mt-0.5">{MONTH_NAMES[selectedMonth]} {selectedYear} — by category</p>
 </div>
 <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">Pie View</span>
 </div>
 </div>
 <div className="p-5">
 {pieData.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-[280px] gap-2 text-muted-foreground">
 <PieChart size={36} className="opacity-30" />
 <p className="text-sm">No expenses for {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
 </div>
 ) : (
 <ResponsiveContainer width="100%" height={280}>
 <RechartsPieChart>
 <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8' }}>
 {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
 </Pie>
 <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
 </RechartsPieChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>
 </div>

 {/* Expandable Expenses List / Accordion */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
 <Receipt className="text-indigo-600 dark:text-indigo-400" size={20} />
 Expenses for {MONTH_NAMES[selectedMonth]} {selectedYear}
 </h3>
 <span className="text-xs font-semibold text-muted-foreground ">
 {expenses.length} record{expenses.length !== 1 ? 's' : ''}
 </span>
 </div>

 {loadingData ? (
 <div className="card-surface p-12 text-center text-muted-foreground ">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
 <p className="text-sm">Updating expense details...</p>
 </div>
 ) : expenses.length === 0 ? (
 <div className="card-surface p-12 text-center text-muted-foreground ">
 <Receipt size={44} className="mx-auto mb-3 opacity-30" />
 <p className="text-base font-medium text-foreground ">No expenses recorded for this month</p>
 <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Expense&quot; above to log a new expense</p>
 </div>
 ) : (
 Object.entries(groupedExpenses).map(([monthTitle, monthExpensesList]) => {
 const isExpanded = expandedMonths[monthTitle] !== false // Default open
 const monthTotal = monthExpensesList.reduce((s, e) => s + Number(e.amount), 0)

 return (
 <div key={monthTitle} className="card-surface overflow-hidden ">
 {/* Month Accordion Header */}
 <button
 onClick={() => toggleMonthExpand(monthTitle)}
 className="w-full px-5 py-4 flex items-center justify-between bg-muted/80 border-b border-border hover:bg-muted transition text-left"
 >
 <div className="flex items-center gap-3">
 {isExpanded ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
 <h4 className="font-bold text-foreground text-base">{monthTitle}</h4>
 <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/40">
 {monthExpensesList.length} items
 </span>
 </div>
 <div className="font-bold text-foreground text-base">
 Subtotal: {formatCurrency(monthTotal)}
 </div>
 </button>

 {/* Month Expenses Table */}
 {isExpanded && (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead>
 <tr className="border-b border-border bg-muted/50 text-muted-foreground ">
 <th className="px-5 py-3 font-medium">Expense Title</th>
 <th className="px-5 py-3 font-medium hidden sm:table-cell">Category</th>
 <th className="px-5 py-3 font-medium">Amount</th>
 <th className="px-5 py-3 font-medium hidden md:table-cell">Date</th>
 <th className="px-5 py-3 font-medium text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
 {monthExpensesList.map((expense) => (
 <tr key={expense.id} className="hover:bg-muted transition">
 <td className="px-5 py-3.5">
 <div className="font-medium text-foreground ">{expense.title}</div>
 {expense.description && <div className="text-xs text-muted-foreground mt-0.5">{expense.description}</div>}
 </td>
 <td className="px-5 py-3.5 hidden sm:table-cell">
 <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20`, color: CATEGORY_COLORS[expense.category] }}>
 {CATEGORY_LABELS[expense.category] || expense.category}
 </span>
 </td>
 <td className="px-5 py-3.5 font-bold text-foreground ">PKR {Number(expense.amount).toLocaleString('en-PK')}</td>
 <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground ">
 {new Date(expense.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
 </td>
 <td className="px-5 py-3.5 text-right">
 <button
 onClick={() => handleDelete(expense.id)}
 className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
 title="Delete expense"
 >
 <Trash2 size={16} />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )
 })
 )}
 </div>

 {/* Add Expense Modal */}
 {showAddForm && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
 <div className="card-surface p-6 w-full max-w-md mx-4 ">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold text-foreground ">Add New Expense</h2>
 <button onClick={() => setShowAddForm(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-lg"><X size={18} /></button>
 </div>
 <form action={handleAdd} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
 <input name="title" required className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 " placeholder="e.g. Monthly Rent" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Amount (PKR) *</label>
 <input name="amount" type="number" min="1" step="0.01" required className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 " />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
 <select name="category" required className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ">
 {CATEGORIES.map(c => (<option key={c} value={c}>{CATEGORY_LABELS[c]}</option>))}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Date</label>
 <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 " />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description</label>
 <textarea name="description" rows={2} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 " placeholder="Optional notes..." />
 </div>
 <div className="flex gap-3 justify-end pt-2">
 <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground ">Cancel</button>
 <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 text-sm font-medium">
 {loading ? 'Adding...' : 'Add Expense'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}

function SummaryCard({ title, value, change, isUp, subtitle, icon, color }: {
 title: string; value: string; change?: string; isUp?: boolean; subtitle?: string
 icon: React.ReactNode; color: string
}) {
 return (
 <div className="card-surface p-5 ">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ">{title}</span>
 {icon}
 </div>
 <div className="text-2xl font-bold text-foreground ">{value}</div>
 {change && (
 <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
 {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
 {change} vs prev month
 </div>
 )}
 {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
 </div>
 )
}

