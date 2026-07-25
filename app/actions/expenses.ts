// app/actions/expenses.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

export async function createExpense(prevState: unknown, formData: FormData) {
  const title = formData.get('title') as string
  const amountRaw = formData.get('amount') as string
  const category = formData.get('category') as string
  const dateRaw = formData.get('date') as string
  const description = formData.get('description') as string

  if (!title || !amountRaw || !category) {
    return { success: false, error: 'Title, amount, and category are required' }
  }

  const amount = parseFloat(amountRaw)
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Invalid amount' }
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: amount,
        category: category as any,
        date: dateRaw ? new Date(dateRaw) : new Date(),
        description: description || null,
      },
    })

    await logAudit({
      action: 'EXPENSE_CREATED',
      entity: 'Expense',
      entityId: expense.id,
      details: { title, amount, category },
    })

    revalidatePath('/admin/expenses')
    return { success: true, message: 'Expense added successfully' }
  } catch (error) {
    console.error('Create Expense Error:', error)
    return { success: false, error: 'Failed to create expense' }
  }
}

export async function deleteExpense(formData: FormData) {
  const expenseId = formData.get('expenseId') as string

  if (!expenseId) {
    return { success: false, error: 'Missing expense ID' }
  }

  try {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } })
    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    await prisma.expense.delete({ where: { id: expenseId } })

    await logAudit({
      action: 'EXPENSE_DELETED',
      entity: 'Expense',
      entityId: expenseId,
      details: { title: expense.title, amount: expense.amount.toString() },
    })

    revalidatePath('/admin/expenses')
    return { success: true, message: 'Expense deleted' }
  } catch (error) {
    console.error('Delete Expense Error:', error)
    return { success: false, error: 'Failed to delete expense' }
  }
}

export async function getExpenses(options?: {
  month?: number
  year?: number
  category?: string
}) {
  const { month, year, category } = options ?? {}

  const now = new Date()
  const targetMonth = month ?? now.getMonth()
  const targetYear = year ?? now.getFullYear()

  const startOfMonth = new Date(targetYear, targetMonth, 1)
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

  const where: Record<string, unknown> = {
    date: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
  }

  if (category && category !== 'ALL') {
    where.category = category
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  return expenses
}

export async function getExpenseSummary(month?: number, year?: number) {
  const now = new Date()
  const targetMonth = month ?? now.getMonth()
  const targetYear = year ?? now.getFullYear()

  const startOfMonth = new Date(targetYear, targetMonth, 1)
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

  // Previous month for comparison
  const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1
  const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear
  const startOfPrevMonth = new Date(prevYear, prevMonth, 1)
  const endOfPrevMonth = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999)

  // Current month expenses
  const currentExpenses = await prisma.expense.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
  })

  // Previous month expenses
  const prevExpenses = await prisma.expense.findMany({
    where: { date: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
  })

  // Current month income (from transactions)
  const currentIncome = await prisma.transaction.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
  })

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {}
  for (const exp of currentExpenses) {
    const cat = exp.category
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Number(exp.amount)
  }

  const totalExpenses = currentExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalPrevExpenses = prevExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalIncome = currentIncome.reduce((sum, t) => sum + Number(t.amount), 0)

  // Monthly trend (last 6 months)
  const monthlyTrend: { month: string; expenses: number; income: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const m = new Date(targetYear, targetMonth - i, 1)
    const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999)

    const [monthExpenses, monthIncome] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: m, lte: mEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { date: { gte: m, lte: mEnd } },
        _sum: { amount: true },
      }),
    ])

    monthlyTrend.push({
      month: m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      expenses: Number(monthExpenses._sum.amount ?? 0),
      income: Number(monthIncome._sum.amount ?? 0),
    })
  }

  return {
    totalExpenses,
    totalPrevExpenses,
    totalIncome,
    netProfit: totalIncome - totalExpenses,
    categoryBreakdown,
    monthlyTrend,
    expenseCount: currentExpenses.length,
  }
}
