import Link from 'next/link'
import { UserPlus, BookOpen, CalendarDays, ArrowRight } from 'lucide-react'

export default function ReceptionistHomePage() {
  return (
    <div className="space-y-6 py-4 md:py-6">
      <section className="premium-panel overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">Receptionist portal</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Admit, enroll, and review schedules in seconds.</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Everything you need for student admissions and day-to-day operations is now organized in a calm, premium workspace.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="premium-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Fast admission</p>
              <h2 className="text-2xl font-semibold text-slate-900">Register new students</h2>
            </div>
            <UserPlus className="text-cyan-600" size={28} />
          </div>
          <p className="mb-6 text-slate-600">Capture student details and admissions without losing momentum.</p>
          <Link href="/receptionist/students/new" className="inline-flex items-center gap-2 font-semibold text-cyan-700 hover:text-cyan-900">
            Start admission <ArrowRight size={16} />
          </Link>
        </section>

        <section className="premium-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Enrollment</p>
              <h2 className="text-2xl font-semibold text-slate-900">Enroll students fast</h2>
            </div>
            <BookOpen className="text-cyan-600" size={28} />
          </div>
          <p className="mb-6 text-slate-600">Choose a registered student, assign a course slot, and confirm enrollment in one flow.</p>
          <Link href="/receptionist/enrollment/new" className="inline-flex items-center gap-2 font-semibold text-cyan-700 hover:text-cyan-900">
            Enroll now <ArrowRight size={16} />
          </Link>
        </section>

        <section className="premium-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Schedule</p>
              <h2 className="text-2xl font-semibold text-slate-900">See seats and timings</h2>
            </div>
            <CalendarDays className="text-cyan-600" size={28} />
          </div>
          <p className="mb-6 text-slate-600">Open the timetable to view student counts, available seats, and batch details instantly.</p>
          <Link href="/receptionist/schedule" className="inline-flex items-center gap-2 font-semibold text-cyan-700 hover:text-cyan-900">
            View schedule <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  )
}
