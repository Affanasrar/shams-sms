// app/admin/completed-students/page.tsx
import { getPendingCompletions, getCompletedEnrollments } from '@/app/actions/course-completion'
import CompletedStudentsClient from './completed-students-client'

export default async function CompletedStudentsPage() {
  const [pendingEnrollments, completedEnrollments] = await Promise.all([
    getPendingCompletions(),
    getCompletedEnrollments(),
  ])

  return (
    <CompletedStudentsClient
      pendingEnrollments={JSON.parse(JSON.stringify(pendingEnrollments))}
      completedEnrollments={JSON.parse(JSON.stringify(completedEnrollments))}
    />
  )
}
