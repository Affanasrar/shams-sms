import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function MySchedulePage() {
 return (
 <div className="p-6 md:p-12 text-center border-2 border-dashed rounded-xl">
 <div className="flex items-center gap-4 mb-6">
 <Link href="/teacher" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
 <ArrowLeft size={20} />
 Back to Dashboard
 </Link>
 </div>
 
 <h2 className="text-xl font-bold text-muted-foreground">My Schedule Calendar</h2>
 <p className="text-muted-foreground text-sm md:text-base">Coming soon.</p>
 </div>
 )
}