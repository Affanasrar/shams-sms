'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export type ReceptionistStudentRow = {
  id: string
  studentId: string
  name: string
  fatherName: string
  phone: string
  admission: string
}

interface ReceptionistStudentListProps {
  students: ReceptionistStudentRow[]
}

export function ReceptionistStudentList({ students }: ReceptionistStudentListProps) {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')

  const filteredStudents = useMemo(() => {
    const term = activeQuery.trim().toLowerCase()
    if (!term) return students
    return students.filter((student) =>
      student.studentId.toLowerCase().includes(term) ||
      student.name.toLowerCase().includes(term) ||
      student.fatherName.toLowerCase().includes(term) ||
      (student.phone || '').toLowerCase().includes(term)
    )
  }, [activeQuery, students])

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Admissions</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Registered students</h2>
              <p className="mt-2 text-sm text-slate-500">Search the student directory by ID, name, father name, or phone.</p>
            </div>

            <div className="flex flex-1 items-center gap-3 xl:flex-none">
              <label className="relative flex-1 xl:w-96">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      setActiveQuery(query)
                    }
                  }}
                  placeholder="Search ID, name, or phone"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
              <button
                type="button"
                onClick={() => setActiveQuery(query)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricPill label="Total" value={students.length} />
            <MetricPill label="Visible" value={filteredStudents.length} />
            <MetricPill label="Filtered" value={activeQuery ? 1 : 0} suffix={activeQuery ? 'active' : 'off'} />
          </div>

          {activeQuery && (
            <div className="mt-4 inline-flex items-center rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm text-cyan-800">
              Filtering by <span className="ml-2 font-semibold">{activeQuery}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Student ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Father's name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Admission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    No students match your search.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-slate-950">{student.studentId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.fatherName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(student.admission).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricPill({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-950">{value}</span>
        {suffix && <span className="text-xs font-medium text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}
