// app/admin/settings/page.tsx
import prisma from '@/lib/prisma'
import { SettingsForms } from './settings-forms'
import { ReportFormatConfig } from './report-format-config'
import Link from 'next/link'
import { PageLayout, PageHeader } from '@/components/ui'
import { WhatsAppConfig } from './whatsapp-config'
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

 // Fetch report formats
 const reportFormats = await prisma.reportFormat.findMany({
 orderBy: { reportType: 'asc' }
 })

 return (
 <PageLayout>
 <PageHeader
 title="Master Data Configuration"
 description="Define structure, courses, assign teachers, and manage WhatsApp/SMS gateways"
 backHref="/admin"
 backLabel="Back to Dashboard"
 />

 <div className="space-y-8">
 {/* WhatsApp & SMS Gateway Manager */}
 <WhatsAppConfig />

 {/* Pass 'teachers' to the form */}
 <SettingsForms rooms={rooms} courses={courses} slots={slots} teachers={teachers} />

 {/* Report Format Configuration */}
 <ReportFormatConfig formats={reportFormats} />
 </div>
 </PageLayout>
 )
}