'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { updateStudent } from '@/app/actions/student'
import { Button } from '@/components/ui/button'

const initialState = { success: false, error: '' }

interface EditStudentProps {
  student: {
    id: string
    studentId: string
    name: string
    fatherName: string
    phone: string
    address: string
  }
}

export function EditStudentForm({ student }: EditStudentProps) {
  const [state, formAction, isPending] = useActionState(updateStudent, initialState)

  return (
    <form action={formAction} className="space-y-6 bg-white p-8 rounded-xl border shadow-sm">
      <input type="hidden" name="id" value={student.id} />
      <input type="hidden" name="studentId" value={student.studentId} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          name="name"
          defaultValue={student.name}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
        <input
          type="text"
          name="fatherName"
          defaultValue={student.fatherName}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          name="phone"
          defaultValue={student.phone}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea
          name="address"
          rows={4}
          defaultValue={student.address}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 flex-wrap">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link
            href={`/admin/students/${student.studentId}`}
            className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  )
}
