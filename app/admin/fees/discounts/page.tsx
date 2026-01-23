// app/admin/fees/discounts/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/fees"
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Student Discounts</h1>
          <p className="text-gray-500 text-sm">Manage fee discounts for enrolled students</p>
        </div>
      </div>

      <Link
        href="/admin/fees/discounts/new"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        <Plus size={18} />
        Apply New Discount
      </Link>

      {discounts.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Discount Type</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Applied From</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{discount.student.name}</div>
                    <div className="text-xs text-gray-500">{discount.student.studentId}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {discount.enrollment.courseOnSlot.course.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                      {discount.discountType === 'FIXED' ? 'Fixed Amount' : 'Percentage'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {discount.discountType === 'FIXED' 
                      ? `PKR ${Number(discount.discountAmount).toLocaleString()}` 
                      : `${discount.discountAmount}%`
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      discount.discountDuration === 'SINGLE_MONTH' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {discount.discountDuration === 'SINGLE_MONTH' ? 'Single Month' : 'Entire Course'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                        className="text-red-600 hover:text-red-800 transition font-medium text-xs inline-flex items-center gap-1"
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
      ) : (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-500">No discounts applied yet.</p>
          <p className="text-sm text-gray-400 mt-2">Click "Apply New Discount" to get started.</p>
        </div>
      )}
    </div>
  )
}
