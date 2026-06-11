import prisma from '@/lib/prisma'
import { PageHeader, PageLayout } from '@/components/ui'
import { ReceptionistEnrollmentList } from '@/components/receptionist/receptionist-enrollment-list'

export const dynamic = 'force-dynamic'

export default async function ReceptionistEnrollmentsPage() {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: 'ACTIVE' },
    include: {
      student: true,
      courseOnSlot: {
        include: {
          course: true,
          slot: { include: { room: true } }
        }
      }
    },
    orderBy: { joiningDate: 'desc' }
  })

  const safeEnrollments = enrollments.map((enrollment) => ({
    id: enrollment.id,
    enrollmentId: enrollment.id,
    studentId: enrollment.student.studentId,
    studentName: enrollment.student.name,
    fatherName: enrollment.student.fatherName,
    phone: enrollment.student.phone,
    courseName: enrollment.courseOnSlot.course.name,
    slotDays: enrollment.courseOnSlot.slot.days,
    slotTime: `${new Date(enrollment.courseOnSlot.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - ${new Date(enrollment.courseOnSlot.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}`,
    roomName: enrollment.courseOnSlot.slot.room.name,
    joiningDate: enrollment.joiningDate.toISOString()
  }))

  return (
    <PageLayout>
      <PageHeader
        title="Receptionist Enrollments"
        description="Search and review active enrollments by student, course, or room."
      />
      <ReceptionistEnrollmentList enrollments={safeEnrollments} />
    </PageLayout>
  )
}
