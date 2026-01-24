// app/admin/schedule/[assignmentId]/students/page.tsx
import prisma from '@/lib/prisma'
import { ArrowLeft, Users, Calendar, Clock, MapPin, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = {
  params: { assignmentId: string }
}

export default async function EnrolledStudentsPage({ params }: Props) {
  const assignmentId = (await params).assignmentId

  if (!assignmentId) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/schedule"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back to Schedule
          </Link>
        </div>
        <div className="bg-white border rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Assignment ID</h1>
          <p className="text-gray-600">The assignment ID is missing or invalid.</p>
        </div>
      </div>
    )
  }

  try {
    // Fetch the assignment with enrolled students
    const assignment = await prisma.courseOnSlot.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
        slot: {
          include: { room: true }
        },
        teacher: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            joiningDate: true,
            endDate: true,
            student: {
              select: {
                id: true,
                name: true,
                phone: true,
                fatherName: true,
                address: true
              }
            }
          }
        }
      }
    })

    if (!assignment) {
      return (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/schedule"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              Back to Schedule
            </Link>
          </div>
          <div className="bg-white border rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600">The requested course assignment could not be found.</p>
          </div>
        </div>
      )
    }

  const totalStudents = assignment.enrollments.length
  const capacity = assignment.slot.room.capacity
  const isFull = totalStudents >= capacity

  // Find the Next Vacancy
  const today = new Date()
  const nextGraduation = assignment.enrollments
    .map(e => e.endDate)
    // Filter out nulls and future dates
    .filter((d): d is Date => d !== null && new Date(d) >= today)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/schedule"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Schedule
        </Link>
      </div>

      {/* Course & Slot Info */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.course.name}</h1>
            <p className="text-gray-600 mt-1">
              Duration: {assignment.course.durationMonths} months
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              totalStudents >= capacity
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}>
              <Users size={16} />
              {totalStudents} / {capacity} Students
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <span>
              {new Date(assignment.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} -
              {new Date(assignment.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <span>{assignment.slot.days}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-500" />
            <span>{assignment.slot.room.name}</span>
          </div>
        </div>

        {assignment.teacher && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <User size={16} className="text-gray-500" />
            <span>Teacher: {assignment.teacher.firstName} {assignment.teacher.lastName}</span>
          </div>
        )}

        {/* First Seat Available Info */}
        {isFull && nextGraduation ? (
          <div className="bg-red-50 p-3 rounded border border-red-100 text-sm text-red-700 flex items-start gap-2 mt-4">
            <LogOut size={16} className="mt-0.5 shrink-0"/>
            <div>
              <div className="font-medium">First Seat Available</div>
              <div>Seat opens: <strong>{new Date(nextGraduation).toLocaleDateString()}</strong></div>
            </div>
          </div>
        ) : (
          !isFull && (
            <div className="bg-green-50 p-3 rounded border border-green-100 text-sm text-green-700 flex items-start gap-2 mt-4">
              <Users size={16} className="mt-0.5 shrink-0"/>
              <div>
                <div className="font-medium">Seats Available Now</div>
                <div>+{capacity - totalStudents} seats available for enrollment</div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/fees"
            className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Users size={20} />
            <span className="font-medium">Collect Fees</span>
          </Link>

          <Link
            href="/admin/enrollment/new"
            className="flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <User size={20} />
            <span className="font-medium">New Enrollment</span>
          </Link>

          <Link
            href="/admin/students/new"
            className="flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <User size={20} />
            <span className="font-medium">New Admission</span>
          </Link>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Enrolled Students ({totalStudents})
        </h2>

        {totalStudents > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignment.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="font-medium text-gray-900 mb-2">
                  {enrollment.student.name}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Father: {enrollment.student.fatherName}</div>
                  <div>Phone: {enrollment.student.phone}</div>
                  {enrollment.student.address && (
                    <div>Address: {enrollment.student.address}</div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Joined: {new Date(enrollment.joiningDate).toLocaleDateString()}
                    </div>
                    {enrollment.endDate && (
                      <div className="text-xs text-gray-500">
                        End: {new Date(enrollment.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No students enrolled in this course slot yet.</p>
          </div>
        )}
      </div>
    </div>
  )
  } catch (error) {
    console.error('Error fetching enrolled students for assignment ID:', assignmentId, error)
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/schedule"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back to Schedule
          </Link>
        </div>
        <div className="bg-white border rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Students</h1>
          <p className="text-gray-600 mb-2">There was an error loading the enrolled students.</p>
          <p className="text-sm text-gray-500">Assignment ID: {assignmentId}</p>
          <p className="text-sm text-gray-500 mt-4">Please try again later or contact support if the problem persists.</p>
        </div>
      </div>
    )
  }
}