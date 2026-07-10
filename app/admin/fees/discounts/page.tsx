// app/admin/fees/discounts/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, BadgePercent, Plus, Sparkles, Trash2 } from 'lucide-react'
import { removeStudentDiscount } from '@/app/actions/discount'

export default async function DiscountsPage() {
  const discounts = await prisma.studentDiscount.findMany({
    include: {
      student: true,
      enrollment: {
        include: { courseOnSlot: { include: { course: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const fixedDiscounts = discounts.filter((discount) => discount.discountType === 'FIXED').length
  const percentageDiscounts = discounts.filter((discount) => discount.discountType === 'PERCENTAGE').length

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-white/75">
              <Link href="/admin/fees" className="rounded-full border border-white/15 p-2 transition hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <span className="text-xs uppercase tracking-[0.3em]">Discount management</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Student discounts</h1>
              <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
                Keep discount records focused and easy to scan.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/fees/discounts/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <Plus size={16} />
                Apply Discount
              </Link>
              <Link
                href="/admin/fees"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Collection
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-lg xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Total discounts</p>
              <p className="mt-2 text-3xl font-semibold">{discounts.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Fixed / Percentage</p>
              <p className="mt-2 text-2xl font-semibold">{fixedDiscounts} / {percentageDiscounts}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Latest update</p>
              <p className="mt-2 text-lg font-semibold">Ordered by newest first</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Scope</p>
              <p className="mt-2 text-lg font-semibold">Active enrolled students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Discounts affect unpaid or partially paid fees only.
      </div>

      {discounts.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="border-b bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Applied discounts</h2>
            <p className="text-sm text-slate-500">A compact view of each student&apos;s current discount rule.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Applied From</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{discount.student.name}</div>
                      <div className="text-xs text-slate-500">{discount.student.studentId}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {discount.enrollment.courseOnSlot.course.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <BadgePercent size={12} />
                        {discount.discountType === 'FIXED' ? 'Fixed Amount' : 'Percentage'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-900">
                      {discount.discountType === 'FIXED'
                        ? `PKR ${Number(discount.discountAmount).toLocaleString()}`
                        : `${discount.discountAmount}%`
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        discount.discountDuration === 'SINGLE_MONTH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-violet-100 text-violet-800'
                      }`}>
                        {discount.discountDuration === 'SINGLE_MONTH' ? 'Single Month' : 'Entire Course'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      Month {discount.applicableFromMonth}
                      {discount.discountDuration === 'ENTIRE_COURSE' && (
                        <span> - Month {discount.applicableToMonth}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => {
                        'use server'
                        await removeStudentDiscount(discount.id)
                      }}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 transition hover:text-rose-800"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Sparkles size={20} />
          </div>
          <p className="mt-4 font-medium text-slate-900">No discounts applied yet.</p>
          <p className="mt-2 text-sm text-slate-500">Apply the first discount to a student from the button above.</p>
        </div>
      )}
    </div>
  )
}
