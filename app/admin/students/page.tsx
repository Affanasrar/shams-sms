// app/admin/students/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { PageHeader, PageLayout } from '@/components/ui'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { subDays } from 'date-fns'
import { StudentTable, StudentRow } from '@/components/students/student-table'

// 👇 Define the props type correctly for Next.js 15+
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StudentList(props: Props) {
  // 1. 👇 AWAIT the searchParams
  const searchParams = await props.searchParams
  const searchQuery = searchParams.q as string | undefined

  // date range parameters; do not impose default range unless user set one
  const now = new Date()
  const hasRangeFilter = Boolean(searchParams.start || searchParams.end)
  const startDate = searchParams.start ? new Date(searchParams.start as string) : subDays(now, 30)
  const endDate = searchParams.end ? new Date(searchParams.end as string) : now
  endDate.setHours(23, 59, 59, 999)

  // 2. Build Dynamic Query
  const whereClause: any = {}
  if (hasRangeFilter) {
    whereClause.admission = { gte: startDate, lte: endDate }
  }
  
  if (searchQuery && searchQuery.trim()) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { studentId: { contains: searchQuery, mode: 'insensitive' } },
      { phone: { contains: searchQuery, mode: 'insensitive' } },
      { fatherName: { contains: searchQuery, mode: 'insensitive' } }
    ]
  }

  const students = await prisma.student.findMany({
    where: whereClause,
    orderBy: { admission: 'desc' },
    take: 50
  })

  const rows: StudentRow[] = students.map(s => ({
    id: s.id,
    studentId: s.studentId,
    name: s.name,
    fatherName: s.fatherName,
    phone: s.phone,
    admission: s.admission
  }))

  return (
    <PageLayout>
      <PageHeader
        title="Student Directory"
        description="Manage and view all students in the system"
        backHref="/admin"
        backLabel="Back to Dashboard"
        actions={
          <>
            <DateRangePicker />
            <Link
              href="/admin/students/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <UserPlus size={16} />
              New Admission
            </Link>
          </>
        }
      />

      <StudentTable data={rows} />
    </PageLayout>
  )
}