'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, CheckCircle2, ChevronDown, Filter,
  Loader2, MessageSquare, Phone, Send, Users, X, Zap
} from 'lucide-react'

type Student = {
  id: string
  studentId: string
  name: string
  fatherName: string
  phone: string | null
  enrollments: Array<{
    courseOnSlot: {
      id: string
      course: { id: string; name: string }
    }
    fees?: Array<{
      id: string
      finalAmount: number
      dueDate: string
      cycleDate: string | null
    }>
  }>
}

type CourseSlot = {
  id: string
  course: { id: string; name: string }
  slot: {
    startTime: string
    endTime: string
    days: string
    room: { name: string }
  }
  teacher: { id: string; firstName: string | null; lastName: string | null } | null
}

type Props = {
  students: Student[]
  courseSlots: CourseSlot[]
  onSent?: () => void
}

type SmsResult = {
  studentId: string
  success: boolean
  message: string
}

export function SmsSender({ students, courseSlots, onSent }: Props) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SmsResult[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedCourseSlot, setSelectedCourseSlot] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [channel, setChannel] = useState<'SMART' | 'WHATSAPP' | 'SMS'>('SMART')

  const uniqueCourses = useMemo(
    () =>
      Array.from(new Map(courseSlots.map(s => [s.course.id, s.course])).values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [courseSlots]
  )

  const filteredCourseSlots = useMemo(
    () => (selectedCourse ? courseSlots.filter(s => s.course.id === selectedCourse) : []),
    [courseSlots, selectedCourse]
  )

  // Only reveal students when user has typed something OR picked a course filter
  const hasActiveFilter = searchQuery.trim().length > 0 || selectedCourse !== ''

  const filteredStudents = useMemo(() => {
    if (!hasActiveFilter) return []
    let list = students.filter(student => {
      if (!selectedCourseSlot) {
        if (!selectedCourse) return true
        return student.enrollments.some(e => e.courseOnSlot.course.id === selectedCourse)
      }
      return student.enrollments.some(e => e.courseOnSlot.id === selectedCourseSlot)
    })
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.phone && s.phone.includes(q))
      )
    }
    return list
  }, [selectedCourse, selectedCourseSlot, students, searchQuery, hasActiveFilter])

  useEffect(() => {
    const ids = filteredStudents.map(s => s.id)
    setSelectedStudents(prev => prev.filter(id => ids.includes(id)))
  }, [filteredStudents])

  const selectedCount = selectedStudents.length
  const visibleCount = filteredStudents.length
  const allVisibleSelected =
    visibleCount > 0 &&
    selectedCount === visibleCount &&
    filteredStudents.every(s => selectedStudents.includes(s.id))

  const charCount = customMessage.trim().length
  const smsPages = charCount === 0 ? 0 : Math.ceil(charCount / 160)

  const handleSelectAll = () => {
    if (allVisibleSelected) setSelectedStudents([])
    else setSelectedStudents(filteredStudents.map(s => s.id))
  }

  const handleCourseChange = (id: string) => {
    setSelectedCourse(id)
    setSelectedCourseSlot('')
    setSelectedStudents([])
    setResults([])
    setFeedback(null)
  }

  const handleSlotChange = (id: string) => {
    setSelectedCourseSlot(id)
    setSelectedStudents([])
    setResults([])
    setFeedback(null)
  }

  const handleToggle = (id: string) => {
    setSelectedStudents(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    setFeedback(null)
  }

  const insertTemplate = (tpl: string) => {
    setCustomMessage(prev => prev + tpl)
    setFeedback(null)
  }

  const handleSend = async () => {
    if (!selectedStudents.length) {
      setFeedback({ type: 'error', text: 'Select at least one student before sending.' })
      return
    }
    if (!customMessage.trim()) {
      setFeedback({ type: 'error', text: 'Write your message before sending.' })
      return
    }
    setSending(true)
    setResults([])
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudents, customMessage: customMessage.trim(), channel }),
      })
      const data = await res.json().catch(() => ({ error: 'Unknown error' }))
      if (res.ok) {
        const next: SmsResult[] = Array.isArray(data.results) ? data.results : []
        setResults(next)
        const ok = next.filter(r => r.success).length
        setFeedback({ type: 'success', text: `${ok} of ${next.length} messages sent successfully.` })
        onSent?.()
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to send SMS.' })
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to send SMS.' })
    } finally {
      setSending(false)
    }
  }

  const fmt = (slot: CourseSlot) => {
    const fmt = (d: string) =>
      new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${fmt(slot.slot.startTime)}–${fmt(slot.slot.endTime)}`
  }

  const canSend = selectedCount > 0 && customMessage.trim().length > 0 && !sending

  return (
    <div className="space-y-6">
      {/* ── Stats bar ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Students', value: students.length, color: 'indigo' },
          { label: 'Visible', value: visibleCount, color: 'sky' },
          { label: 'Selected', value: selectedCount, color: 'violet' },
          { label: 'Last Sent', value: results.filter(r => r.success).length, color: 'emerald' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4 text-center shadow-sm`}
          >
            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-col layout ───────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">

        {/* LEFT: Compose + Filters */}
        <div className="space-y-5">

          {/* Compose */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Compose Message</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sent to every selected student</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {charCount > 0 && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    charCount > 320 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : charCount > 160 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {charCount} chars · {smsPages} SMS
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                value={customMessage}
                onChange={e => { setCustomMessage(e.target.value); setFeedback(null) }}
                placeholder="Type your message here...&#10;&#10;Example: Dear [Student Name], your fee of PKR [Amount] is due. Please contact the admin. — Shams Institute"
                rows={6}
                className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-sm leading-7 text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
              />

              {/* Template chips */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Insert variable</p>
                <div className="flex flex-wrap gap-2">
                  {['[Student Name]', '[Student ID]', '[Amount]', '[Due Date]'].map(tpl => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => insertTemplate(tpl)}
                      className="rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:border-indigo-300"
                    >
                      {tpl}
                    </button>
                  ))}
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 select-none">
                    Auto-personalized per student
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <Filter size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Audience Filters</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Narrow recipients by course or time slot</p>
                </div>
              </div>
              {(selectedCourse || selectedCourseSlot) && (
                <button
                  onClick={() => { setSelectedCourse(''); setSelectedCourseSlot(''); setSelectedStudents([]); setResults([]); setFeedback(null) }}
                  className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            <div className="p-5 grid gap-4 sm:grid-cols-3">
              {/* Course select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Course</label>
                <div className="relative">
                  <select
                    value={selectedCourse}
                    onChange={e => handleCourseChange(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 pr-10 text-sm text-slate-900 dark:text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40"
                  >
                    <option value="">All courses ({students.length} students)</option>
                    {uniqueCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* Slot select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Time Slot</label>
                <div className="relative">
                  <select
                    value={selectedCourseSlot}
                    onChange={e => handleSlotChange(e.target.value)}
                    disabled={!selectedCourse}
                    className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 pr-10 text-sm text-slate-900 dark:text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">{selectedCourse ? 'All slots for this course' : 'Select a course first'}</option>
                    {filteredCourseSlots.map(cs => (
                      <option key={cs.id} value={cs.id}>
                        {fmt(cs)} · {cs.slot.days} · {cs.slot.room.name}
                        {cs.teacher ? ` · ${[cs.teacher.firstName, cs.teacher.lastName].filter(Boolean).join(' ')}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* Channel select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Delivery Channel</label>
                <div className="relative">
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value as any)}
                    className="w-full appearance-none rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 px-4 py-3 pr-10 text-sm font-semibold text-indigo-900 dark:text-indigo-200 outline-none transition focus:border-indigo-500"
                  >
                    <option value="SMART">⚡ WA First → SMS Fallback</option>
                    <option value="WHATSAPP">💬 WhatsApp Only</option>
                    <option value="SMS">📱 Textbee SMS Only</option>
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-3.5 text-indigo-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Send Results */}
          {results.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <Zap size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Send Results</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{results.filter(r => r.success).length} delivered</span>
                      {results.filter(r => !r.success).length > 0 && (
                        <> · <span className="text-rose-600 dark:text-rose-400 font-semibold">{results.filter(r => !r.success).length} failed</span></>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {results.map(result => {
                  const student = students.find(s => s.id === result.studentId)
                  return (
                    <div
                      key={result.studentId}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                        result.success
                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/30'
                          : 'border-rose-200 bg-rose-50 dark:border-rose-800/40 dark:bg-rose-950/30'
                      }`}
                    >
                      {result.success
                        ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                        : <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
                      }
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {student?.name || 'Unknown'}
                        </span>
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{result.message}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Student picker + Send */}
        <div className="space-y-4">

          {/* Student list */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                    <Users size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recipients</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCount} of {visibleCount} selected</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-900/60"
                >
                  {allVisibleSelected ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {/* Search */}
              <div className="relative mt-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, ID, or phone..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 dark:focus:ring-sky-900/40"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Student rows */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {!hasActiveFilter ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
                  <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 p-4">
                    <MessageSquare size={22} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Search or filter to find recipients</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Type a name or ID in the search box,<br />or select a course above.</p>
                  </div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-5">
                  <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3">
                    <MessageSquare size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No students found</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {searchQuery ? 'Try a different name, ID, or phone number.' : 'No students enrolled in this course.'}
                  </p>
                </div>
              ) : (
                filteredStudents.map(student => {
                  const selected = selectedStudents.includes(student.id)
                  const recentFee = student.enrollments
                    .flatMap(e => e.fees ?? [])
                    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0]

                  return (
                    <label
                      key={student.id}
                      className={`flex cursor-pointer items-start gap-3 px-5 py-3.5 transition ${
                        selected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-2 border-l-indigo-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-l-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleToggle(student.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.studentId} · s/o {student.fatherName}</p>
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                            <Phone size={9} />
                            {student.phone ? student.phone : 'No phone'}
                          </span>
                        </div>
                        {recentFee && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                              Due {new Date(recentFee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                              PKR {Number(recentFee.finalAmount).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            {/* Footer count */}
            {filteredStudents.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedCount}</span> selected ·{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">{visibleCount}</span> visible
                </p>
              </div>
            )}
          </div>

          {/* Send panel */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-5 space-y-4">
              {/* Validation summary */}
              <div className="space-y-2">
                <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                  selectedCount > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <CheckCircle2 size={14} />
                  {selectedCount > 0 ? `${selectedCount} recipient${selectedCount > 1 ? 's' : ''} ready` : 'No recipients selected'}
                </div>
                <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                  customMessage.trim()
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <CheckCircle2 size={14} />
                  {customMessage.trim() ? `Message ready (${smsPages} SMS page${smsPages > 1 ? 's' : ''})` : 'No message written'}
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50 dark:border-rose-800/40 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
                }`}>
                  {feedback.type === 'success'
                    ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    : <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  }
                  <span>{feedback.text}</span>
                </div>
              )}

              {/* Send button */}
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!canSend}
                className={`group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
                  canSend
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-indigo-900/40 hover:shadow-indigo-300 dark:hover:shadow-indigo-900/60 hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                }`}
              >
                {sending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending to {selectedCount} student{selectedCount > 1 ? 's' : ''}…
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Send SMS{selectedCount > 0 ? ` (${selectedCount})` : ''}
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                Messages delivered via Textbee · Personalized per recipient
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}