import prisma from '@/lib/prisma'
import { ArrowLeft, CalendarDays, MapPin, School2, UserRound } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { EditEnrollmentForm } from '../edit-enrollment-form'

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

  const currentSlotStart = enrollment.courseOnSlot.slot.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Karachi'
  })
  const currentSlotEnd = enrollment.courseOnSlot.slot.endTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Karachi'
  })

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-white/75">
              <Link href="/admin/enrollment" className="rounded-full border border-white/15 p-2 transition hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <span className="text-xs uppercase tracking-[0.3em]">Enrollment editor</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Edit enrollment</h1>
              <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
                Update the course slot or joining date and keep fee due dates aligned automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/students/${enrollment.student.studentId}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <UserRound size={16} />
                View student
              </Link>
              <Link
                href="/admin/enrollment"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Enrollment list
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-lg xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Student</p>
              <p className="mt-2 text-lg font-semibold">{enrollment.student.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current course</p>
              <p className="mt-2 text-lg font-semibold">{enrollment.courseOnSlot.course.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current slot</p>
              <p className="mt-2 text-lg font-semibold">{enrollment.courseOnSlot.slot.days}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Timing</p>
              <p className="mt-2 text-lg font-semibold">{currentSlotStart} - {currentSlotEnd}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Edit enrollment details</h2>
              <p className="mt-1 text-sm text-slate-500">Change the assigned course slot or enrollment date.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Active only
            </div>
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

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Joining date</p>
                <p className="font-semibold text-slate-900">{enrollment.joiningDate.toISOString().slice(0, 10)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                <School2 size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Room</p>
                <p className="font-semibold text-slate-900">{enrollment.courseOnSlot.slot.room.name}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current slot label</p>
                <p className="font-semibold text-slate-900">{enrollment.courseOnSlot.slot.days}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Changing the joining date recalculates due dates for unpaid and partial fees only.
          </div>
        </div>
      </div>
    </div>
  )
}
