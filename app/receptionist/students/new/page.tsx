'use client'

import { createStudent } from '@/app/actions/student'
import { useActionState } from 'react'
import Link from 'next/link'
import { ReceptionistSummaryGrid } from '@/components/receptionist/receptionist-summary-grid'
import { ArrowLeft, BadgeCheck, Sparkles, UserPlus } from 'lucide-react'

const initialState = { success: false, error: '' }

export default function ReceptionistAdmissionPage() {
  const [state, formAction, isPending] = useActionState(createStudent, initialState)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
              <Sparkles size={12} />
              Admission desk
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Capture a new student in a calm, guided flow.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Keep the intake focused with a minimal form, a clear action, and consistent front-desk styling.
              </p>
            </div>
          </div>

          <ReceptionistSummaryGrid
            items={[
              { label: 'Step', value: '1 / 1', icon: <UserPlus size={16} /> },
              { label: 'Focus', value: 'Admission', icon: <BadgeCheck size={16} /> }
            ]}
          />
        </div>
      </section>

      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3 rounded-3xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-cyan-800">
          <UserPlus size={18} />
          <p className="text-sm font-medium">Add the student details below, then confirm admission.</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Link href="/receptionist" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>

        <form action={formAction} className="space-y-5">
          <Field label="Full Name" name="name" placeholder="e.g. Muhammad Ali" />
          <Field label="Father's Name" name="fatherName" placeholder="e.g. Ahmed Khan" />
          <Field label="Phone Number" name="phone" placeholder="0300-1234567" type="tel" />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Address <span className="text-slate-400">(optional)</span></label>
            <textarea
              name="address"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white"
            />
          </div>

          {state?.error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Saving admission...' : 'Confirm admission'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, placeholder, type = 'text' }: { label: string; name: string; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        required
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white"
      />
    </div>
  )
}

