import { getStudentProfile } from '@/app/actions/get-student-profile'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { EditStudentForm } from './edit-student-form'

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params
  const student = await getStudentProfile(id)

  const editStudent = {
    id: student.id,
    studentId: student.studentId,
    name: student.name,
    fatherName: student.fatherName,
    phone: student.phone ?? '',
    address: student.address ?? '',
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/students/${student.studentId}`} className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2">
          <ArrowLeft size={20} />
          Back to Profile
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Edit Student Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update the student record for {student.name}. You can change the name, phone, father&apos;s name, and address.
        </p>
      </div>

      <EditStudentForm student={editStudent} />
    </div>
  )
}
