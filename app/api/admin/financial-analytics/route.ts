// app/api/admin/financial-analytics/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminApiRole } from '@/lib/auth-utils'

export async function GET() {
 try {
 const { isAdmin } = await verifyAdminApiRole()
 if (!isAdmin) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const now = new Date()
 const targetYear = now.getFullYear()
 const targetMonth = now.getMonth()

 // Generate monthly range for the past 6 months
 const monthsData = []
 let cumulativeNetIncome = 0

 for (let i = 5; i >= 0; i--) {
 const startOfMonth = new Date(targetYear, targetMonth - i, 1)
 const endOfMonth = new Date(targetYear, targetMonth - i + 1, 0, 23, 59, 59, 999)
 const monthLabel = startOfMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

 const [feeAgg, transAgg, expAgg, enrollCount] = await Promise.all([
 // Total billed/due fees in month
 prisma.fee.aggregate({
 where: { dueDate: { gte: startOfMonth, lte: endOfMonth } },
 _sum: { finalAmount: true },
 }),
 // Total collected fees in month
 prisma.transaction.aggregate({
 where: { date: { gte: startOfMonth, lte: endOfMonth } },
 _sum: { amount: true },
 }),
 // Total expenses in month
 prisma.expense.aggregate({
 where: { date: { gte: startOfMonth, lte: endOfMonth } },
 _sum: { amount: true },
 }),
 // Total new enrollments in month
 prisma.enrollment.count({
 where: { joiningDate: { gte: startOfMonth, lte: endOfMonth } },
 }),
 ])

 const dueAmount = Number(feeAgg._sum.finalAmount || 0)
 const collectedAmount = Number(transAgg._sum.amount || 0)
 const expenseAmount = Number(expAgg._sum.amount || 0)
 const netIncome = collectedAmount - expenseAmount
 cumulativeNetIncome += netIncome

 monthsData.push({
 month: monthLabel,
 dueAmount,
 collectedAmount,
 expenseAmount,
 netIncome,
 runningTotal: cumulativeNetIncome,
 newAdmissions: enrollCount,
 })
 }

 // Expense Breakdown by Category (Current Year / overall)
 const expenseRecords = await prisma.expense.findMany({
 select: { category: true, amount: true },
 })

 const categoryTotals: Record<string, number> = {}
 let totalExpenseSum = 0

 for (const exp of expenseRecords) {
 const amt = Number(exp.amount)
 categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt
 totalExpenseSum += amt
 }

 const categoryFormatted = [
 'SALARY', 'RENT', 'UTILITIES', 'SUPPLIES', 'MAINTENANCE', 'MARKETING', 'OTHER'
 ].map((cat) => ({
 name: cat.charAt(0) + cat.slice(1).toLowerCase(),
 category: cat,
 amount: categoryTotals[cat] || 0,
 percentage: totalExpenseSum > 0 ? Number((((categoryTotals[cat] || 0) / totalExpenseSum) * 100).toFixed(1)) : 0,
 })).filter(c => c.amount > 0 || totalExpenseSum === 0)

 return NextResponse.json({
 success: true,
 monthlyCollectionTrend: monthsData,
 expenseBreakdown: categoryFormatted,
 totalExpensesOverall: totalExpenseSum,
 currentRunningTotal: cumulativeNetIncome,
 })
 } catch (error) {
 console.error('Financial Analytics API error:', error)
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
 }
}
