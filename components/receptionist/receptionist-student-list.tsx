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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Admissions</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">Registered students</p>
          </div>
          <div className="flex flex-1 items-center gap-3 sm:flex-none">
            <label className="relative flex-1">
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
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            <button
              type="button"
              onClick={() => setActiveQuery(query)}
              className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Search
            </button>
          </div>
        </div>
        {activeQuery && (
          <div className="mt-4 text-sm text-slate-500">
            Filtering by: <span className="font-semibold text-slate-900">{activeQuery}</span>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student ID</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Father's name</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phone</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                  No students match your search.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{student.studentId}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{student.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{student.fatherName}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{student.phone}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{new Date(student.admission).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
