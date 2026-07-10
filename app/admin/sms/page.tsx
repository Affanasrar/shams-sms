'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Inbox,
  Megaphone,
  MessageSquare,
  Phone,
  RefreshCcw,
  Send,
  Users
} from 'lucide-react'
import { SmsSender } from './sms-sender'

type SmsMessage = {
  id: string
  message: string
  direction: 'OUTBOUND' | 'INBOUND'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
  createdAt: string
  textbeeId?: string | null
  errorMsg?: string | null
}

type InboxStudent = {
  id: string
  name: string
  studentId: string
  phone: string
  smsMessages: SmsMessage[]
}

type SmsLog = {
  id: string
  studentId: string | null
  studentName: string | null
  studentCode: string
  message: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
  createdAt: string
}

type SenderStudent = {
  id: string
  studentId: string
  name: string
  fatherName: string
  phone: string | null
  enrollments: Array<{
    courseOnSlot: {
      id: string
      course: {
        id: string
        name: string
      }
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
  course: {
    id: string
    name: string
  }
  slot: {
    startTime: string
    endTime: string
    days: string
    room: {
      name: string
    }
  }
  teacher: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
}

type SmsSummary = {
  conversations: number
  messages: number
  logs: number
  senderStudents: number
}

export default function SmsPage() {
  const [contacts, setContacts] = useState<InboxStudent[]>([])
  const [activeChat, setActiveChat] = useState<InboxStudent | null>(null)
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)

  const [senderStudents, setSenderStudents] = useState<SenderStudent[]>([])
  const [courseSlots, setCourseSlots] = useState<CourseSlot[]>([])
  const [senderLoading, setSenderLoading] = useState(true)
  const [senderError, setSenderError] = useState<string | null>(null)
  const [view, setView] = useState<'inbox' | 'logs' | 'sender'>('inbox')

  const summary: SmsSummary = {
    conversations: contacts.length,
    messages: messages.length,
    logs: smsLogs.length,
    senderStudents: senderStudents.length
  }

  const hydrateActiveChat = (nextContacts: InboxStudent[], fallbackId?: string | null) => {
    if (!fallbackId) {
      return nextContacts[0] ?? null
    }

    return nextContacts.find(contact => contact.id === fallbackId) ?? nextContacts[0] ?? null
  }

  const loadSmsData = async (preferredChatId?: string | null) => {
    setGlobalError(null)
    setLogsError(null)
    setSenderError(null)
    setLoadingContacts(true)
    setLogsLoading(true)
    setSenderLoading(true)

    try {
      const [contactsRes, logsRes, senderRes] = await Promise.all([
        fetch('/api/admin/sms/inbox'),
        fetch('/api/admin/sms/inbox?logs=true'),
        fetch('/api/admin/sms/inbox?senderData=true')
      ])

      if (!contactsRes.ok) {
        throw new Error('Failed to fetch conversations')
      }

      if (!logsRes.ok) {
        throw new Error('Failed to fetch SMS logs')
      }

      if (!senderRes.ok) {
        throw new Error('Failed to load sender data')
      }

      const [contactsData, logsData, senderData] = await Promise.all([
        contactsRes.json(),
        logsRes.json(),
        senderRes.json()
      ])

      setContacts(contactsData)
      setSmsLogs(logsData)
      setSenderStudents(senderData.students ?? [])
      setCourseSlots(senderData.courseSlots ?? [])
      setActiveChat(current => hydrateActiveChat(contactsData, preferredChatId ?? current?.id ?? null))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load SMS data.'
      setGlobalError(message)
      setLogsError(message)
      setSenderError(message)
    } finally {
      setLoadingContacts(false)
      setLogsLoading(false)
      setSenderLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadSmsData()
  }, [])

  useEffect(() => {
    if (!activeChat?.id) {
      setMessages([])
      return
    }

    const controller = new AbortController()
    let isMounted = true

    setLoadingMessages(true)
    setGlobalError(null)

    const fetchMessages = async () => {
      try {
        const params = new URLSearchParams({ studentId: activeChat.id })
        const res = await fetch(`/api/admin/sms/inbox?${params.toString()}`, {
          signal: controller.signal
        })

        if (!res.ok) {
          throw new Error('Failed to fetch messages')
        }

        const messagesData = await res.json()
        if (isMounted) {
          setMessages(messagesData)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        if (isMounted) {
          setGlobalError('Failed to load messages.')
        }
      } finally {
        if (isMounted) {
          setLoadingMessages(false)
        }
      }
    }

    void fetchMessages()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [activeChat?.id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSmsData(activeChat?.id ?? null)
  }

  const handleSendReply = async () => {
    if (!reply.trim() || !activeChat) return

    const messageContent = reply.trim()
    setSending(true)
    setSendError(null)

    const tempMsg: SmsMessage = {
      id: `temp-${Date.now()}`,
      message: messageContent,
      direction: 'OUTBOUND',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempMsg])

    try {
      const response = await fetch('/api/admin/sms/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: activeChat.id, message: messageContent })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(payload.error || `API error: ${response.status}`)
      }

      const createdMessage = await response.json()
      setMessages(prev => prev.map(msg => (msg.id === tempMsg.id ? createdMessage : msg)))
      setReply('')
      await loadSmsData(activeChat.id)
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempMsg.id))
      setSendError(error instanceof Error ? error.message : 'Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCheck size={14} className="text-cyan-400" />
      case 'SENT':
        return <Check size={14} className="text-slate-300" />
      case 'PENDING':
        return <Clock3 size={14} className="text-slate-300" />
      case 'FAILED':
        return <AlertTriangle size={14} className="text-rose-400" />
      default:
        return null
    }
  }

  const formatClock = (value: string) => {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-800/80 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-950/30 md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-3 text-white/70">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em]">
                <Megaphone size={12} />
                SMS operations
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Messages, reminders, and logs in one command center.</h1>
              <p className="max-w-2xl text-sm leading-6 text-white/70 md:text-base">
                Review conversations, send one-off replies, and push filtered reminders without leaving the page.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleRefresh()}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh data
              </button>
              <button
                type="button"
                onClick={() => setView('inbox')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10"
              >
                <Inbox size={16} />
                Inbox
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-136 xl:grid-cols-2">
            <StatCard label="Conversations" value={summary.conversations} icon={<Inbox size={16} />} />
            <StatCard label="Loaded messages" value={summary.messages} icon={<MessageSquare size={16} />} />
            <StatCard label="Recent logs" value={summary.logs} icon={<FileText size={16} />} />
            <StatCard label="Students in sender" value={summary.senderStudents} icon={<Users size={16} />} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <TabButton active={view === 'inbox'} onClick={() => setView('inbox')} icon={<Inbox size={16} />} label="Inbox" />
          <TabButton active={view === 'logs'} onClick={() => setView('logs')} icon={<FileText size={16} />} label="Logs" />
          <TabButton active={view === 'sender'} onClick={() => setView('sender')} icon={<Megaphone size={16} />} label="Custom SMS" />
        </div>
      </div>

      <div className="grid gap-6">
        {view === 'inbox' ? (
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
                    <p className="text-sm text-slate-500">Open a student thread and reply from the same screen.</p>
                  </div>
                  <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    {contacts.length} threads
                  </div>
                </div>
              </div>

              <div className="max-h-[calc(100vh-310px)] overflow-y-auto">
                {loadingContacts ? (
                  <div className="p-6 text-center text-sm text-slate-500">Loading conversations...</div>
                ) : contacts.length === 0 ? (
                  <EmptyState
                    icon={<Inbox size={24} />}
                    title="No conversations yet"
                    description="SMS threads will appear here after students reply or you send a message."
                  />
                ) : (
                  contacts.map(contact => {
                    const latest = contact.smsMessages?.[0]
                    const isActive = activeChat?.id === contact.id

                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => setActiveChat(contact)}
                        className={`flex w-full flex-col gap-3 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 ${
                          isActive ? 'bg-sky-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">{contact.name}</p>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{contact.studentId}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                            {contact.phone}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm text-slate-600">
                          {latest?.message || 'No recent SMS message.'}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{latest ? formatLongDate(latest.createdAt) : 'No timestamp yet'}</span>
                          <span className="uppercase tracking-[0.16em]">{latest?.status || 'Idle'}</span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </section>

            <section className="flex min-h-160 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                    <p className="text-sm text-slate-500">Reply, refresh, and keep the thread state current.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <Phone size={14} />
                    {activeChat ? activeChat.phone : 'Select a student'}
                  </div>
                </div>
              </div>

              {activeChat ? (
                <>
                  <div className="flex-1 min-h-0 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
                    {loadingMessages ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading thread...</div>
                    ) : messages.length === 0 ? (
                      <EmptyState
                        icon={<MessageSquare size={24} />}
                        title="No messages in this thread"
                        description="Send the first message to start a conversation."
                      />
                    ) : (
                      <div className="space-y-4">
                        {messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${msg.direction === 'OUTBOUND' ? 'rounded-br-md bg-slate-950 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'}`}>
                              <div className="whitespace-pre-wrap wrap-break-word text-sm leading-6">{msg.message}</div>
                              <div className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${msg.direction === 'OUTBOUND' ? 'text-slate-300' : 'text-slate-500'}`}>
                                <span>{formatClock(msg.createdAt)}</span>
                                {msg.direction === 'OUTBOUND' && getStatusIcon(msg.status)}
                                {msg.status === 'FAILED' && <span title={msg.errorMsg || 'Send failed'}>Failed</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {sendError && (
                    <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">{sendError}</div>
                  )}

                  <div className="border-t border-slate-100 bg-white p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <input
                        type="text"
                        value={reply}
                        onChange={e => {
                          setReply(e.target.value)
                          setSendError(null)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void handleSendReply()
                          }
                        }}
                        placeholder="Type a reply and press Enter"
                        disabled={sending}
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSendReply()}
                        disabled={sending || !reply.trim()}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={16} className={sending ? 'animate-pulse' : ''} />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Users size={24} />}
                  title="Select a student"
                  description="Pick a conversation from the left to inspect the thread and send a reply."
                />
              )}
            </section>
          </div>
        ) : view === 'sender' ? (
          <div className="mx-auto w-full max-w-5xl">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Custom SMS Sender</h2>
                <p className="mt-1 text-sm text-slate-500">Filter students by course or slot, then send a shared message to the selected group.</p>
              </div>
              <div className="p-5 md:p-6">
                {senderLoading ? (
                  <div className="text-sm text-slate-500">Loading sender tools...</div>
                ) : senderError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{senderError}</div>
                ) : (
                  <SmsSender students={senderStudents} courseSlots={courseSlots} onSent={() => void handleRefresh()} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Recent SMS events</h2>
                <p className="mt-1 text-sm text-slate-500">See the latest inbound and outbound activity across the system.</p>
              </div>
              <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-5 md:p-6">
                {logsLoading ? (
                  <div className="text-sm text-slate-500">Loading SMS events...</div>
                ) : logsError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{logsError}</div>
                ) : smsLogs.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={24} />}
                    title="No SMS events found"
                    description="Outbound messages and inbound replies will appear here once activity starts."
                  />
                ) : (
                  <div className="space-y-3">
                    {smsLogs.map(log => (
                      <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{log.studentCode || 'Unknown student'}</p>
                            <p className="text-sm text-slate-500">{log.studentName || 'No name available'}</p>
                          </div>
                          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusTone(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{log.message}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{log.direction}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {globalError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {globalError}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3 text-white/75">
        <p className="text-xs uppercase tracking-[0.2em] text-white/55">{label}</p>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active ? 'bg-slate-950 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function EmptyState({
  icon,
  title,
  description
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-70 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">{icon}</div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="max-w-md text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function statusTone(status: SmsLog['status']) {
  switch (status) {
    case 'SENT':
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-700'
    case 'FAILED':
      return 'bg-rose-100 text-rose-700'
    case 'PENDING':
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}