// app/admin/fees/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { CollectButton } from './collect-button'
import { ArrowLeft, LayoutDashboard, Percent, Search } from 'lucide-react'
import { Prisma } from '@prisma/client'

// 👇 Define the props type correctly for Next.js 15+
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FeesPage(props: Props) {
  // 1. 👇 AWAIT the searchParams
  const searchParams = await props.searchParams
  const studentId = searchParams.studentId as string | undefined
  const search = searchParams.search as string | undefined

  // Build where clause - show all fees that have outstanding balance (not fully paid)
  const whereClause: Prisma.FeeWhereInput = {
    OR: [
      { status: 'UNPAID' },
      { status: 'PARTIAL' }
    ]
  }
  
  if (studentId) {
    whereClause.student = { id: studentId }
  } else if (search && search.trim()) {
    whereClause.OR = [
      { student: { name: { contains: search, mode: 'insensitive' } } },
      { student: { studentId: { contains: search, mode: 'insensitive' } } },
      { student: { fatherName: { contains: search, mode: 'insensitive' } } }
    ]
  }

  const dueFees = await prisma.fee.findMany({
    where: whereClause,
    include: {
      student: true,
      enrollment: {
        include: { courseOnSlot: { include: { course: true, slot: { include: { room: true } } } } }
      }
    },
    orderBy: { dueDate: 'asc' }
  })

  const totalPendingAmount = dueFees.reduce(
    (sum, fee) => sum + (Number(fee.finalAmount) - Number(fee.paidAmount)),
    0
  )

  // 👇 SELF-HEALING FIX: Find Admin, or Create one if missing
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }})
  
  if (!admin) {
    console.log("⚠️ No Admin found. Creating default 'Super Admin'...")
    admin = await prisma.user.create({
      data: {
        firstName: "Super", 
        lastName: "Admin",
        email: "admin@shams.com",
        role: 'ADMIN',
        clerkId: "manual_admin_001", // This satisfies the unique constraint
        
        // ❌ REMOVED: username (Not in schema)
        // ❌ REMOVED: password (Not in schema)
      }
    })
  }
  
  const adminId = admin.id
  // 👆 END OF FIX

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
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-white/75">
              <Link href="/admin/fees/dashboard" className="rounded-full border border-white/15 p-2 transition hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <span className="text-xs uppercase tracking-[0.3em]">Fee collection</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Collect pending fees</h1>
              <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
                Search a student, review the balance, and collect only what is due.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/fees/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link
                href="/admin/fees/discounts"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Percent size={16} />
                Discounts
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[32rem] xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Pending fees</p>
              <p className="mt-2 text-3xl font-semibold">{dueFees.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Outstanding amount</p>
              <p className="mt-2 text-3xl font-semibold">PKR {totalPendingAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current filter</p>
              <p className="mt-2 text-lg font-semibold">{search ? 'Search active' : 'All students'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Next action</p>
              <p className="mt-2 text-lg font-semibold">Collect only the due balance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by student name, ID, or father's name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Search size={16} />
              Search
            </button>
            <Link
              href="/admin/fees"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pending fees</h2>
            <p className="text-sm text-slate-500">
              {studentId
                ? `Fees for ${dueFees.length > 0 ? dueFees[0].student.name : 'this student'}`
                : 'Showing unpaid and partially paid records only.'
              }
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{dueFees.length}</span> unpaid fee{dueFees.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Course / Timing</th>
                <th className="px-6 py-3">Balance</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dueFees.map((fee) => {
                const courseName = fee.enrollment?.courseOnSlot.course.name ?? 'General Fee'
                const timingLabel = formatTimingLabel(fee)
                const remainingAmount = Number(fee.finalAmount) - Number(fee.paidAmount)

                return (
                  <tr key={fee.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-medium text-rose-600">
                      {new Date(fee.dueDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{fee.student.name}</div>
                      <div className="text-xs text-slate-500">{fee.student.studentId} • s/o {fee.student.fatherName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">{courseName}</div>
                        <div className="text-xs text-slate-500">{timingLabel}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <div className="font-semibold text-slate-900">PKR {Number(fee.finalAmount).toLocaleString()}</div>
                      <div className="text-xs text-rose-600">Due: PKR {remainingAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CollectButton feeId={fee.id} adminId={adminId} remainingAmount={remainingAmount} />
                    </td>
                  </tr>
                )
              })}

              {dueFees.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    ✅ No pending fees. Good job!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}