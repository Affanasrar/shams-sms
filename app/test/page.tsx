// app/test/page.tsx
import prisma from '@/lib/prisma'
import { EnrollButton } from './enroll-button' // We will create this small component next

export default async function TestPage() {
  // 1. Fetch the Data we just seeded
  const lab1 = await prisma.room.findFirst({
    where: { name: 'Computer Lab 1' },
    include: { slots: true }
  })

  // 2. Fetch a CourseOnSlot assignment
  // We need the ID that links "MS Office" to "9-10 AM"
  const assignment = await prisma.courseOnSlot.findFirst({
    where: {
      slot: {
        room: { name: 'Computer Lab 1'}
      }
    },
    include: { course: true, slot: true }
  })

  if (!assignment) return <div>❌ Seed data not found. Run "npx prisma db seed"</div>

  return (
    <div className="p-10 font-sans space-y-6">
      <h1 className="text-2xl font-bold">🧪 System Diagnostics</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-green-50">
          <h3 className="font-bold">Detected Room</h3>
          <p>{lab1?.name}</p>
          <p>Capacity: {lab1?.capacity}</p>
        </div>

        <div className="p-4 border rounded bg-blue-50">
          <h3 className="font-bold">Target Assignment</h3>
          <p>Course: {assignment.course.name}</p>
          <p>Slot ID: {assignment.id}</p>
        </div>
      </div>

      <div className="p-6 border-2 border-dashed border-gray-300 rounded">
        <h2 className="text-xl mb-4">Action Zone</h2>
        {/* We pass the ID to the client button */}
        <EnrollButton courseOnSlotId={assignment.id} />
      </div>
    </div>
  )
}