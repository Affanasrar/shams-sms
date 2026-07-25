// app/admin/expenses/expenses-client.tsx
'use client'

import { useState } from 'react'
import { createExpense, deleteExpense } from '@/app/actions/expenses'
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Trash2,
  Receipt, ArrowUpRight, ArrowDownRight, X
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
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const summary = initialSummary

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
    if (result.success) { setShowAddForm(false); setMessage({ type: 'success', text: result.message || 'Added' }) }
    else { setMessage({ type: 'error', text: result.error || 'Failed' }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    setMessage(null)
    const fd = new FormData(); fd.set('expenseId', id)
    const result = await deleteExpense(fd)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message || result.error || '' })
  }

  const formatCurrency = (n: number) => `PKR ${n.toLocaleString('en-PK')}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-indigo-600" size={28} />
            Expense Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage institute expenses</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Expenses" value={formatCurrency(summary.totalExpenses)} change={`${expenseChange}%`} isUp={Number(expenseChange) > 0} icon={<TrendingDown className="text-red-500" size={20} />} color="red" />
        <SummaryCard title="Total Income" value={formatCurrency(summary.totalIncome)} subtitle="From fee payments" icon={<TrendingUp className="text-green-500" size={20} />} color="green" />
        <SummaryCard title="Net Profit" value={formatCurrency(summary.netProfit)} subtitle="Income − Expenses" icon={<DollarSign className={summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'} size={20} />} color={summary.netProfit >= 0 ? 'green' : 'red'} />
        <SummaryCard title="Expenses Count" value={String(summary.expenseCount)} subtitle="This month" icon={<PieChart className="text-indigo-500" size={20} />} color="indigo" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Income vs Expenses (6 Months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Categories</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No expenses this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
        </div>
        {initialExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p>No expenses recorded this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{expense.title}</div>
                      {expense.description && <div className="text-xs text-gray-500 mt-0.5">{expense.description}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}15`, color: CATEGORY_COLORS[expense.category] }}>
                        {CATEGORY_LABELS[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">PKR {Number(expense.amount).toLocaleString('en-PK')}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                      {new Date(expense.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <form action={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input name="title" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Monthly Rent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
                  <input name="amount" type="number" min="1" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select name="category" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    {CATEGORIES.map(c => (<option key={c} value={c}>{CATEGORY_LABELS[c]}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium">
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
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {change && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${isUp ? 'text-red-500' : 'text-green-500'}`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change} vs last month
        </div>
      )}
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  )
}
