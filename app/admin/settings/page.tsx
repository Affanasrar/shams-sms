// app/admin/settings/page.tsx
import prisma from '@/lib/prisma'
import { SettingsForms } from './settings-forms'
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const rooms = await prisma.room.findMany()

  // Convert Decimals to Numbers for Courses
  const rawCourses = await prisma.course.findMany({ orderBy: { name: 'asc' } })
  const courses = rawCourses.map(c => ({ ...c, baseFee: Number(c.baseFee) }))

  const slots = await prisma.slot.findMany({
    include: { room: true },
    orderBy: { startTime: 'asc' }
  })

  // 👇 NEW: Fetch all users who are TEACHERS (or ADMINS who teach)
  const teachers = await prisma.user.findMany({
    where: { 
      OR: [
        { role: 'TEACHER' },
        { role: 'ADMIN' }
      ]
    },
    orderBy: { firstName: 'asc' }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">⚙️ Master Data Configuration</h1>
      <p className="text-gray-500">Define structure, courses, and assign teachers.</p>
      
      {/* Pass 'teachers' to the form */}
      <SettingsForms rooms={rooms} courses={courses} slots={slots} teachers={teachers} />
    </div>
  )
}