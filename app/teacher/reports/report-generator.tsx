'use client'

import { useState } from 'react'

interface ClassItem {
  id: string
  course: { id: string; name: string }
  slot?: { days?: string }
  _count?: { enrollments?: number }
}

export function ReportGenerator({ classes, teacherId }: { classes: ClassItem[]; teacherId: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [year, setYear] = useState<string>(String(new Date().getFullYear()))

  const downloadPdf = async (resp: Response) => {
    const blob = await resp.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const generateAttendance = async (classId: string) => {
    if (!month || !year) return alert('Choose month and year')
    setLoadingId(classId)
    try {
      // Fetch report data from admin attendance reports endpoint
      const q = new URLSearchParams({ classId, month, year })
      const r = await fetch(`/api/admin/attendance/reports?${q.toString()}`)
      if (!r.ok) throw new Error('Failed to fetch attendance data')
      const data = await r.json()

      // Generate PDF
      const gen = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'attendance', data })
      })

      if (!gen.ok) {
        const err = await gen.json()
        throw new Error(err.error || 'Failed to generate PDF')
      }

      await downloadPdf(gen)
    } catch (e: any) {
      alert(e.message || 'Error')
    }
    setLoadingId(null)
  }

  const generateStudentList = async (classId: string) => {
    setLoadingId(classId)
    try {
      const r = await fetch(`/api/teacher/class-students?classId=${encodeURIComponent(classId)}`)
      if (!r.ok) throw new Error('Failed to fetch class students')
      const data = await r.json()

      // Prepare CourseReport payload (basic financials zeroed)
      const payload = {
        course: { id: data.course.id, name: data.course.name, durationMonths: 0, baseFee: 0, feeType: 'MONTHLY' },
        totalStudents: data.totalStudents,
        totalCollected: 0,
        totalPending: 0,
        students: data.students.map((s: any) => ({
          id: s.id,
          studentId: s.studentId,
          name: s.name,
          fatherName: s.fatherName,
          totalPaid: 0,
          totalPending: 0
        }))
      }

      const gen = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'course', data: payload })
      })

      if (!gen.ok) {
        const err = await gen.json()
        throw new Error(err.error || 'Failed to generate PDF')
      }

      await downloadPdf(gen)
    } catch (e: any) {
      alert(e.message || 'Error')
    }
    setLoadingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm">Month</label>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-2 py-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={String(i + 1)}>{i + 1}</option>
          ))}
        </select>
        <label className="text-sm">Year</label>
        <input value={year} onChange={(e) => setYear(e.target.value)} className="border rounded px-2 py-1 w-24" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {classes.map((c) => (
          <div key={c.id} className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="font-medium">{c.course.name}</div>
                <div className="text-sm text-gray-500">{c.slot?.days || ''} • {c._count?.enrollments || 0} students</div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => generateAttendance(c.id)} disabled={!!loadingId} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{loadingId === c.id ? '...' : 'Attendance Report'}</button>
                <button onClick={() => generateStudentList(c.id)} disabled={!!loadingId} className="px-3 py-1 bg-gray-900 text-white rounded text-sm">{loadingId === c.id ? '...' : 'Student List'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
