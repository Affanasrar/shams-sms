// app/admin/attendance/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, Users, Clock, MapPin, Edit } from 'lucide-react'
import { PageLayout, PageHeader } from '@/components/ui'

export default async function AdminAttendancePage() {
  // Fetch all active classes with their enrollments
  const classes = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: { include: { room: true } },
      teacher: true,
      _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } }
    },
    orderBy: { course: { name: 'asc' } }
  })

  return (
    <PageLayout>
      <PageHeader
        title="Attendance Management"
        description="View and manage student attendance across all classes"
        backHref="/admin"
        backLabel="Back to Dashboard"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white border hover:border-blue-500 hover:shadow-md transition-all p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{cls.course.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {cls.teacher ? `Teacher: ${cls.teacher.firstName} ${cls.teacher.lastName}` : 'No teacher assigned'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{cls._count.enrollments}</div>
                <div className="text-xs text-gray-500">Students</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={14} />
                <span>{cls.slot.days}</span>
                <span>•</span>
                <span>{new Date(cls.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} />
                <span>{cls.slot.room.name}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/attendance/${cls.id}`}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Users size={16} />
                View Attendance
              </Link>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
          <p className="text-gray-500">There are no active classes to manage attendance for.</p>
        </div>
      )}
    </PageLayout>
  )
}