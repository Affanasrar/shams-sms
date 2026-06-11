import prisma from '@/lib/prisma'
import { PageHeader, PageLayout } from '@/components/ui'
import { ReceptionistStudentList } from '@/components/receptionist/receptionist-student-list'

export const dynamic = 'force-dynamic'

export default async function ReceptionistStudentsPage() {
  const students = await prisma.student.findMany({
    orderBy: { admission: 'desc' }
  })

  const safeStudents = students.map((student) => ({
    ...student,
    admission: student.admission.toISOString()
  }))

  return (
    <PageLayout>
      <PageHeader
        title="Receptionist Admissions"
        description="Review all registered students and quickly search by name, ID, or phone."
      />
      <ReceptionistStudentList students={safeStudents} />
    </PageLayout>
  )
}
