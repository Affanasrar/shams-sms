// app/admin/fees/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { CollectButton } from './collect-button'
import { FeeRow } from './fee-row'
import { ArrowLeft, LayoutDashboard, Percent, Search, Clock, DollarSign, CheckCircle, FileText } from 'lucide-react'
import { Prisma } from '@prisma/client'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FeesPage(props: Props) {
  const searchParams = await props.searchParams
  const studentId = searchParams.studentId as string | undefined
  const search = searchParams.search as string | undefined
  const filter = (searchParams.filter as string) || 'pending'

  // Build where clause based on filter
  const whereClause: Prisma.FeeWhereInput = {}

  if (filter === 'pending') {
    whereClause.status = { in: ['UNPAID', 'PARTIAL'] }
  } else if (filter === 'paid') {
    whereClause.status = 'PAID'
  }
  // if filter === 'all', no status restriction

  if (studentId) {
    whereClause.student = { id: studentId }
  } else if (search && search.trim()) {
    whereClause.AND = [
      {
        OR: [
          { student: { name: { contains: search, mode: 'insensitive' } } },
          { student: { studentId: { contains: search, mode: 'insensitive' } } },
          { student: { fatherName: { contains: search, mode: 'insensitive' } } }
        ]
      }
    ]
  }

  const dueFees = await prisma.fee.findMany({
    where: whereClause,
    include: {
      student: true,
      enrollment: {
        include: { courseOnSlot: { include: { course: true, slot: { include: { room: true } } } } }
      },
      transactions: {
        include: { collectedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { date: 'desc' }
      }
    },
    orderBy: { dueDate: 'desc' }
  })

  const totalPendingAmount = dueFees.reduce(
    (sum, fee) => sum + (Number(fee.finalAmount) - Number(fee.paidAmount)),
    0
  )

  const totalCollectedAmount = dueFees.reduce(
    (sum, fee) => sum + Number(fee.paidAmount),
    0
  )

  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }})
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        firstName: "Super", 
        lastName: "Admin",
        email: "admin@shams.com",
        role: 'ADMIN',
        clerkId: "manual_admin_001",
      }
    })
  }
  
  const adminId = admin.id

  function formatTimingLabel(fee: (typeof dueFees)[number]) {
    const slot = fee.enrollment?.courseOnSlot.slot
    if (!slot) return 'Unassigned timing'

    const start = slot.startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi'
    })
    const end = slot.endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi'
    })

    return `${start} - ${end}${slot.room?.name ? ` • ${slot.room.name}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-white/75">
              <Link href="/admin" className="rounded-full border border-white/15 p-2 transition hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <span className="text-xs uppercase tracking-[0.3em]">Fee Management</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Fees & Payment History</h1>
              <p className="mt-2 text-sm text-white/70">
                Collect monthly fees, view inline payment timelines, and dispatch WhatsApp PDF vouchers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/fees/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <LayoutDashboard size={16} />
              Financial Dashboard
            </Link>
            <Link
              href="/admin/fees/discounts"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Percent size={16} />
              Discounts
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats & Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
          <Link
            href={`/admin/fees?filter=pending${search ? `&search=${search}` : ''}`}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              filter === 'pending'
                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending Fees ({filter === 'pending' ? dueFees.length : 'Unpaid'})
          </Link>
          <Link
            href={`/admin/fees?filter=all${search ? `&search=${search}` : ''}`}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Records & History
          </Link>
          <Link
            href={`/admin/fees?filter=paid${search ? `&search=${search}` : ''}`}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              filter === 'paid'
                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Paid History
          </Link>
        </div>

        {/* Search Input */}
        <form className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="search"
            defaultValue={search || ''}
            placeholder="Search student by name or ID..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Fees Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Course & Slot</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dueFees.map((fee) => (
                <FeeRow
                  key={fee.id}
                  feeId={fee.id}
                  adminId={adminId}
                  dueDate={fee.dueDate.toISOString()}
                  studentName={fee.student.name}
                  studentCode={fee.student.studentId}
                  fatherName={fee.student.fatherName}
                  courseName={fee.enrollment?.courseOnSlot?.course?.name || 'Course Fee'}
                  timingLabel={formatTimingLabel(fee)}
                  finalAmount={Number(fee.finalAmount)}
                  paidAmount={Number(fee.paidAmount)}
                  remainingAmount={Number(fee.finalAmount) - Number(fee.paidAmount)}
                  transactions={fee.transactions.map((t) => ({
                    id: t.id,
                    date: t.date.toISOString(),
                    amount: Number(t.amount),
                    collectorName: t.collectedBy ? `${t.collectedBy.firstName || ''} ${t.collectedBy.lastName || ''}`.trim() : 'System Admin'
                  }))}
                />
              ))}
            </tbody>
          </table>
        </div>

        {dueFees.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-slate-900 dark:text-white">No fee records found</p>
            <p className="text-xs mt-1">Try switching tabs or searching for another student name.</p>
          </div>
        )}
      </div>
    </div>
  )
}