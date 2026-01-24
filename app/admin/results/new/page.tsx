// app/admin/results/new/page.tsx
import prisma from '@/lib/prisma'
import { ResultForm } from './result-form' // We create this next
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewResultPage() {
  // Fetch all students for the dropdown
  const students = await prisma.student.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, fatherName: true }
  })

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">🏆 Enter Exam Result</h1>
      <div className="bg-white p-8 rounded-lg border shadow-sm">
        <ResultForm students={students} />
      </div>
    </div>
  )
}