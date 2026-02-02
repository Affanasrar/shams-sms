// app/teacher/reports/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ReportGenerator } from './report-generator'
import { PageLayout } from '@/components/ui'

export default async function TeacherReportsPage() {
  const { userId } = await auth()
  const user = await currentUser()
  if (!userId || !user) redirect('/sign-in')

  const email = user.emailAddresses?.[0]?.emailAddress
  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } })
  if (!dbUser) redirect('/')

  const myClasses = await prisma.courseOnSlot.findMany({
    where: { teacherId: dbUser.id },
    include: { course: true, slot: { include: { room: true } }, _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } } },
    orderBy: { slot: { startTime: 'asc' } }
  })

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-500">Generate attendance and student list reports for your classes.</p>
        </div>

        <ReportGenerator classes={myClasses} teacherId={dbUser.id} />
      </div>
    </PageLayout>
  )
}
