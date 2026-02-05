// app/admin/fees/discounts/new/page.tsx
'use client'

import Link from 'next/link'
import { applyStudentDiscount } from '@/app/actions/discount'
import { ArrowLeft } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'

export default function NewDiscountPage({ enrollments }: any) {
  const [state, formAction] = useActionState(applyStudentDiscount, { success: false })
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([])

  useEffect(() => {
    // Fetch enrollments on client side
    const fetchEnrollments = async () => {
      const response = await fetch('/api/enrollments')
      const data = await response.json()
      setEnrollmentsList(data)
    }
    fetchEnrollments()
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/fees/discounts"
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Apply Student Discount</h1>
          <p className="text-gray-500 text-sm">Set up a fee discount for an enrolled student</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        {state.success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
            ✅ Discount applied successfully!
          </div>
        )}
        {state.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg">
            ❌ {state.error}
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg">
          <strong>Note:</strong> Discounts are only applied to unpaid or partially paid fees. 
          If a student has already paid their fees in full, the discount will not affect those months. 
          This ensures fair billing and prevents over-refunds.
        </div>

        <form action={formAction} className="space-y-6">
          
          {/* Enrollment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Student & Course *
            </label>
            <select
              name="enrollmentId"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Choose a student enrollment...</option>
              {enrollmentsList.map((enrollment: any) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.student.name} ({enrollment.student.studentId}) - {enrollment.courseOnSlot.course.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Only active enrollments are shown</p>
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Discount Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="discountType" value="FIXED" defaultChecked required />
                <span className="text-sm font-medium">Fixed Amount (PKR)</span>
              </label>
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="discountType" value="PERCENTAGE" required />
                <span className="text-sm font-medium">Percentage (%)</span>
              </label>
            </div>
          </div>

          {/* Discount Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Discount Amount *
            </label>
            <input
              type="number"
              step="0.01"
              name="discountAmount"
              placeholder="e.g., 500 for PKR 500 or 10 for 10%"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the discount amount or percentage</p>
          </div>

          {/* Discount Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Discount Duration *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="discountDuration" value="SINGLE_MONTH" defaultChecked required />
                <div>
                  <span className="text-sm font-medium">Single Month</span>
                  <p className="text-xs text-gray-500">Apply discount for only one month</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="discountDuration" value="ENTIRE_COURSE" required />
                <div>
                  <span className="text-sm font-medium">Entire Course</span>
                  <p className="text-xs text-gray-500">Apply discount to all months of the course</p>
                </div>
              </label>
            </div>
          </div>

          {/* Applicable From Month */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Apply From Month (1-based) *
            </label>
            <select
              name="applicableFromMonth"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select month...</option>
              <option value="1">Month 1 (First month)</option>
              <option value="2">Month 2</option>
              <option value="3">Month 3</option>
              <option value="4">Month 4</option>
              <option value="5">Month 5</option>
              <option value="6">Month 6</option>
              <option value="7">Month 7</option>
              <option value="8">Month 8</option>
              <option value="9">Month 9</option>
              <option value="10">Month 10</option>
              <option value="11">Month 11</option>
              <option value="12">Month 12</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Starting month for the discount</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-sm text-blue-900 mb-2">How Discounts Work</h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Fixed Amount: Deduct exact amount from monthly fee</li>
              <li>Percentage: Deduct percentage of monthly fee</li>
              <li>Single Month: Discount applies to only that month</li>
              <li>Entire Course: Discount applies to all months</li>
              <li>Underpayments are automatically rolled over to next month</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Apply Discount
            </button>
            <Link
              href="/admin/fees/discounts"
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
