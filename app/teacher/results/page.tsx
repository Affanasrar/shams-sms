import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ResultsPage() {
  return (
    <div className="p-12 text-center border-2 border-dashed rounded-xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>
      
      <h2 className="text-xl font-bold text-gray-400">Exam Results Module</h2>
      <p className="text-gray-500">Coming soon in Module 12.</p>
    </div>
  )
}