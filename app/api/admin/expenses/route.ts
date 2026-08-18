// app/api/admin/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getExpenses, getExpenseSummary } from '@/app/actions/expenses'
import { verifyAdminApiRole } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
 const { isAdmin } = await verifyAdminApiRole()
 if (!isAdmin) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 }

 const { searchParams } = new URL(request.url)
 const monthParam = searchParams.get('month')
 const yearParam = searchParams.get('year')
 const categoryParam = searchParams.get('category')

 const now = new Date()
 const month = monthParam !== null ? parseInt(monthParam) : now.getMonth()
 const year = yearParam !== null ? parseInt(yearParam) : now.getFullYear()

 try {
 const [expenses, summary] = await Promise.all([
 getExpenses({ month, year, category: categoryParam || undefined }),
 getExpenseSummary(month, year),
 ])

 return NextResponse.json({
 expenses: JSON.parse(JSON.stringify(expenses)),
 summary: JSON.parse(JSON.stringify(summary)),
 })
 } catch (error) {
 console.error('Error fetching expenses:', error)
 return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
 }
}
