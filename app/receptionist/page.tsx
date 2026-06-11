import Link from 'next/link'
import { UserPlus, BookOpen, CalendarDays, ArrowRight } from 'lucide-react'

export default function ReceptionistHomePage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-600 mb-3">Receptionist Portal</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Admit, enroll, and review schedules in seconds.</h1>
          <p className="max-w-2xl text-slate-600">This workspace is built for fast student admission, quick enrollment, and a clear seat availability view that works on desktop and mobile.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Fast Admission</p>
                <h2 className="text-2xl font-semibold text-slate-900">Register New Students</h2>
              </div>
              <UserPlus className="text-cyan-600" size={28} />
            </div>
            <p className="text-slate-600 mb-6">Quickly capture student details and admission information without losing time.</p>
            <Link href="/receptionist/students/new" className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:text-cyan-900">
              Start Admission <ArrowRight size={16} />
            </Link>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Enrollment</p>
                <h2 className="text-2xl font-semibold text-slate-900">Enroll Students Fast</h2>
              </div>
              <BookOpen className="text-cyan-600" size={28} />
            </div>
            <p className="text-slate-600 mb-6">Choose a registered student, pick a course slot, and confirm enrollment in one flow.</p>
            <Link href="/receptionist/enrollment/new" className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:text-cyan-900">
              Enroll Now <ArrowRight size={16} />
            </Link>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Schedule</p>
                <h2 className="text-2xl font-semibold text-slate-900">See Seats & Timings</h2>
              </div>
              <CalendarDays className="text-cyan-600" size={28} />
            </div>
            <p className="text-slate-600 mb-6">Open the class timetable to see student counts, available seats, and batch timing details.</p>
            <Link href="/receptionist/schedule" className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:text-cyan-900">
              View Schedule <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
