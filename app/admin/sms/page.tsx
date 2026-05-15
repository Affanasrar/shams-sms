'use client'

import { useEffect, useState } from 'react'
import { Send, User, Check, CheckCheck, Clock, RefreshCcw, MessageSquare } from 'lucide-react'
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

export default function SmsPage() {
  const [contacts, setContacts] = useState<InboxStudent[]>([])
  const [activeChat, setActiveChat] = useState<InboxStudent | null>(null)
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
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

  useEffect(() => {
    const loadInboxData = async () => {
      setGlobalError(null)
      setLoadingContacts(true)
      setLogsLoading(true)
      setSenderLoading(true)
      setLogsError(null)
      setSenderError(null)

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

        const contactsData = await contactsRes.json()
        const logsData = await logsRes.json()
        const senderData = await senderRes.json()

        setContacts(contactsData)
        setSmsLogs(logsData)
        setSenderStudents(senderData.students ?? [])
        setCourseSlots(senderData.courseSlots ?? [])

        setActiveChat(current => current ?? contactsData[0] ?? null)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load SMS data.'
        setGlobalError(message)
        setLogsError(message)
        setSenderError(message)
      } finally {
        setLoadingContacts(false)
        setLogsLoading(false)
        setSenderLoading(false)
      }
    }

    loadInboxData()
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

    fetchMessages()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [activeChat?.id])

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
      setMessages(prev => prev.map(msg => msg.id === tempMsg.id ? createdMessage : msg))
      setReply('')
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
        return <CheckCheck size={14} className="text-blue-500" />
      case 'SENT':
        return <Check size={14} className="text-gray-400" />
      case 'PENDING':
        return <Clock size={14} className="text-gray-400" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">SMS Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">One place for SMS inbox, sending, and logs</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage conversations, send one-off messages, and review recent SMS activity from a single admin dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <RefreshCcw size={16} />
            Refresh data
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('inbox')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'inbox' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Inbox
          </button>
          <button
            type="button"
            onClick={() => setView('logs')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'logs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Logs
          </button>
          <button
            type="button"
            onClick={() => setView('sender')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'sender' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Custom SMS
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {view === 'inbox' ? (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b px-5 py-4 bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                <p className="text-sm text-gray-500">Select a student and reply directly from the inbox.</p>
              </div>
              <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {contacts.length} contacts
              </div>
            </div>
          </div>

          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {loadingContacts ? (
              <div className="p-6 text-center text-gray-500">Loading conversations…</div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No conversations found yet.</div>
            ) : (
              contacts.map(contact => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setActiveChat(contact)}
                  className={`group flex w-full flex-col gap-2 border-b px-5 py-4 text-left transition ${
                    activeChat?.id === contact.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900">{contact.name}</span>
                    <span className="text-xs text-gray-500">{contact.studentId}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{contact.smsMessages?.[0]?.message || 'No recent message'}</p>
                </button>
              ))
            )}
          </div>
        </section>

            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
              <div className="border-b px-5 py-4 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
                <p className="text-sm text-gray-500">Reply to the selected student below.</p>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {activeChat ? activeChat.phone : 'No student selected'}
              </div>
            </div>
          </div>

          {activeChat ? (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-white">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-gray-500">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                    <MessageSquare size={40} />
                    <p>No messages yet. Send the first message to start the conversation.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                          msg.direction === 'OUTBOUND'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 rounded-bl-none text-gray-800'
                        }`}
                        >
                          <div className="whitespace-pre-wrap break-words text-sm">{msg.message}</div>
                          <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-gray-400">
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.direction === 'OUTBOUND' && getStatusIcon(msg.status)}
                            {msg.status === 'FAILED' && (
                              <span className="text-red-400" title={msg.errorMsg || 'Send failed'}>✕</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {sendError && (
                <div className="border-t px-5 py-3 bg-red-50 text-sm text-red-700">{sendError}</div>
              )}

              <div className="border-t bg-white p-5">
                <div className="flex items-center gap-3">
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
                        handleSendReply()
                      }
                    }}
                    placeholder="Type a message and press Enter to send"
                    disabled={sending}
                    className="flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={sending || !reply.trim()}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send size={16} className={sending ? 'animate-pulse' : ''} />
                    <span className="ml-2">Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-4 p-10 text-center text-gray-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <User size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select a student to open the inbox</h3>
                <p className="mt-2 text-sm text-gray-500">The conversation thread will appear here once you choose a contact.</p>
              </div>
            </div>
          )}
        </section>
          </div>
        ) : view === 'sender' ? (
          <div className="max-w-4xl mx-auto w-full">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b px-5 py-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Custom SMS Sender</h2>
                <p className="mt-1 text-sm text-gray-500">Send filtered custom SMS to students from one place.</p>
              </div>
              <div className="p-5">
                {senderLoading ? (
                  <div className="text-sm text-gray-500">Loading sender tools…</div>
                ) : senderError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{senderError}</div>
                ) : (
                  <SmsSender students={senderStudents} courseSlots={courseSlots} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b px-5 py-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Recent SMS Events</h2>
                <p className="mt-1 text-sm text-gray-500">Latest SMS sends and replies in the system.</p>
              </div>
              <div className="max-h-[calc(100vh-64px)] overflow-y-auto p-5">
                {logsLoading ? (
                  <div className="text-sm text-gray-500">Loading SMS events…</div>
                ) : logsError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{logsError}</div>
                ) : smsLogs.length === 0 ? (
                  <div className="text-sm text-gray-500">No SMS events found.</div>
                ) : (
                  <div className="space-y-4">
                    {smsLogs.map(log => (
                      <div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{log.studentCode || 'Unknown student'}</p>
                            <p className="mt-1 text-sm text-gray-600">{log.studentName || 'No name available'}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            log.status === 'SENT' || log.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">{log.message}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{log.direction}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {globalError}
        </div>
      )}
    </div>
  )
}
