// app/admin/enrollment/new/page.tsx
import { EnrollmentForm } from './enrollment-form'
import { getEnrollmentOptions } from '@/app/actions/fetch-options'

export default async function NewEnrollmentPage() {
  const data = await getEnrollmentOptions()

  // 👇 FIX: Convert 'Decimal' objects to plain 'Numbers'
  // This cleans the data so the Client Component can read it without crashing.
  const safeAssignments = data.assignments.map((assignment) => ({
    ...assignment,
    course: {
      ...assignment.course,
      baseFee: Number(assignment.course.baseFee) // Convert Decimal -> Number
    }
  }))
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📝 New Student Enrollment</h1>
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        {/* Pass 'safeAssignments' instead of 'data.assignments' */}
        <EnrollmentForm students={data.students} assignments={safeAssignments} />
      </div>
    </div>
  )
}