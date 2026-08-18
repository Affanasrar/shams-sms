// app/admin/expenses/page.tsx
import { getExpenses, getExpenseSummary } from '@/app/actions/expenses'
import ExpensesClient from '@/app/admin/expenses/expenses-client'

export default async function ExpensesPage() {
 const [expenses, summary] = await Promise.all([
 getExpenses(),
 getExpenseSummary(),
 ])

 return (
 <ExpensesClient
 initialExpenses={JSON.parse(JSON.stringify(expenses))}
 initialSummary={JSON.parse(JSON.stringify(summary))}
 />
 )
}
