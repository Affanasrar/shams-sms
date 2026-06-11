'use client'

import { createStudent } from '@/app/actions/student'
import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const initialState = { success: false, error: '' }

export default function ReceptionistAdmissionPage() {
  const [state, formAction, isPending] = useActionState(createStudent, initialState)

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/receptionist" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Receptionist Home
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">🎓 New Student Admission</h1>

      <form action={formAction} className="space-y-6 bg-white p-8 rounded-lg border shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Muhammad Ali"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
          <input
            type="text"
            name="fatherName"
            required
            placeholder="e.g. Ahmed Khan"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            required
            placeholder="0300-1234567"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
          <textarea
            name="address"
            rows={3}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        {state?.error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            ⚠️ {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-cyan-600 text-white py-3 rounded font-medium hover:bg-cyan-700 transition disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Confirm Admission'}
        </button>
      </form>
    </div>
  )
}
