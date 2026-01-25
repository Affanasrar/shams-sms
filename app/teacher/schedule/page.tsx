import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function MySchedulePage() {
  return (
    <div className="p-6 md:p-12 text-center border-2 border-dashed rounded-xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>
      
      <h2 className="text-xl font-bold text-gray-400">My Schedule Calendar</h2>
      <p className="text-gray-500 text-sm md:text-base">Coming soon.</p>
    </div>
  )
}