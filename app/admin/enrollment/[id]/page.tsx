import prisma from '@/lib/prisma'
import { PageHeader, PageLayout } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { EditEnrollmentForm } from './edit-enrollment-form'

export default async function EditEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      student: true,
      courseOnSlot: {
        include: {
          course: true,
          slot: { include: { room: true } }
        }
      }
    }
  })

  if (!enrollment) {
    notFound()
  }

  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: { include: { room: true } }
    },
    orderBy: [
      { course: { name: 'asc' } },
      { slot: { startTime: 'asc' } }
    ]
  })

  return (
    <PageLayout>
      <PageHeader
        title="Edit Enrollment"
        description={`Update course and joining date for ${enrollment.student.name}`}
        backHref="/admin/enrollment"
        backLabel="Back to Enrollments"
      />

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Enrollment</h1>
            <p className="text-sm text-muted-foreground mt-1">Change the course slot or enrollment date and update fee due dates automatically.</p>
          </div>
          <Link
            href="/admin/enrollment"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-muted transition"
          >
            <ArrowLeft size={16} /> Back to Enrollments
          </Link>
        </div>

        <EditEnrollmentForm
          enrollment={{
            id: enrollment.id,
            studentId: enrollment.studentId,
            studentName: enrollment.student.name,
            currentCourseOnSlotId: enrollment.courseOnSlotId,
            currentCourseName: enrollment.courseOnSlot.course.name,
            currentSlotLabel: enrollment.courseOnSlot.slot.days,
            currentSlotTime: enrollment.courseOnSlot.slot.startTime,
            currentSlotRoom: enrollment.courseOnSlot.slot.room.name,
            joiningDate: enrollment.joiningDate.toISOString().slice(0, 10)
          }}
          assignments={assignments.map((assignment) => ({
            id: assignment.id,
            courseId: assignment.courseId,
            courseName: assignment.course.name,
            slotLabel: assignment.slot.days,
            slotStartTime: assignment.slot.startTime.toISOString(),
            slotEndTime: assignment.slot.endTime.toISOString(),
            roomName: assignment.slot.room.name,
            roomCapacity: assignment.slot.room.capacity
          }))}
        />
      </div>
    </PageLayout>
  )
}
