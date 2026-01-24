// app/admin/students/new/page.tsx
'use client'

import { createStudent } from '@/app/actions/student'
import { useActionState } from 'react' // 👈 CHANGED: Import from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Initial state for the server action
const initialState = { success: false, error: '' }

export default function NewStudentPage() {
  // 👈 CHANGED: useActionState instead of useFormState
  // It returns [state, action, isPending]
  const [state, formAction, isPending] = useActionState(createStudent, initialState)

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/students" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Students
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">🎓 New Student Admission</h1>
      
      <form action={formAction} className="space-y-6 bg-white p-8 rounded-lg border shadow-sm">
        
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            type="text" name="name" required placeholder="e.g. Muhammad Ali"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        {/* Father Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
          <input 
            type="text" name="fatherName" required placeholder="e.g. Ahmed Khan"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input 
            type="tel" name="phone" required placeholder="0300-1234567"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
          <textarea 
            name="address" rows={3}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        {/* Error Message */}
        {state?.error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            ⚠️ {state.error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending} // 👈 Disable while submitting
          className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Confirm Admission'}
        </button>
      </form>
    </div>
  )
}