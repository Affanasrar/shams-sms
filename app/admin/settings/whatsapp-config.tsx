'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, QrCode, RefreshCw, CheckCircle2, AlertCircle, Send, LogOut, ShieldCheck, Sparkles, Smartphone } from 'lucide-react'

type StatusState = {
 state: 'open' | 'connecting' | 'close' | 'unknown'
 instanceName: string
 error?: string
}

export function WhatsAppConfig() {
 const [status, setStatus] = useState<StatusState>({ state: 'unknown', instanceName: 'shams-whatsapp' })
 const [loadingStatus, setLoadingStatus] = useState(true)
 
 // QR Code state
 const [qrCodeData, setQrCodeData] = useState<{ base64?: string; code?: string; pairingCode?: string } | null>(null)
 const [loadingQr, setLoadingQr] = useState(false)
 const [qrError, setQrError] = useState<string | null>(null)

 // Test Message State
 const [testPhone, setTestPhone] = useState('')
 const [testMsg, setTestMsg] = useState('Hello! This is a test message from Shams SMS system.')
 const [testChannel, setTestChannel] = useState<'SMART' | 'WHATSAPP' | 'SMS'>('SMART')
 const [sendingTest, setSendingTest] = useState(false)
 const [testResult, setTestResult] = useState<{ success: boolean; channelUsed?: string; id?: string; error?: string } | null>(null)

 const fetchStatus = async () => {
 setLoadingStatus(true)
 try {
 const res = await fetch('/api/admin/whatsapp/status')
 if (res.ok) {
 const data = await res.json()
 setStatus(data)
 if (data.state === 'open') {
 setQrCodeData(null) // Hide QR code if open
 }
 }
 } catch (err) {
 console.error('Failed to fetch WA status:', err)
 } finally {
 setLoadingStatus(false)
 }
 }

 useEffect(() => {
 fetchStatus()
 }, [])

 const handleConnectQr = async () => {
 setLoadingQr(true)
 setQrError(null)
 try {
 const res = await fetch('/api/admin/whatsapp/status', { method: 'POST' })
 if (res.ok) {
 const data = await res.json()
 if (data.success && (data.base64 || data.code)) {
 setQrCodeData(data)
 } else {
 setQrError(data.error || 'Failed to generate QR code')
 }
 } else {
 setQrError('HTTP Server error when connecting')
 }
 } catch (err) {
 setQrError(err instanceof Error ? err.message : 'Network error')
 } finally {
 setLoadingQr(false)
 fetchStatus()
 }
 }

 const handleDisconnect = async () => {
 if (!confirm('Are you sure you want to disconnect WhatsApp session?')) return
 try {
 await fetch('/api/admin/whatsapp/status', { method: 'DELETE' })
 setQrCodeData(null)
 fetchStatus()
 } catch (err) {
 console.error('Logout error:', err)
 }
 }

 const handleSendTest = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!testPhone) return
 setSendingTest(true)
 setTestResult(null)

 try {
 const res = await fetch('/api/admin/whatsapp/send', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 phone: testPhone,
 message: testMsg,
 channel: testChannel,
 }),
 })

 if (res.ok) {
 const data = await res.json()
 setTestResult(data)
 } else {
 setTestResult({ success: false, error: 'Server error sending message' })
 }
 } catch (err) {
 setTestResult({ success: false, error: err instanceof Error ? err.message : 'Network error' })
 } finally {
 setSendingTest(false)
 }
 }

 const isConnected = status.state === 'open'
 const isConnecting = status.state === 'connecting'

 return (
 <div className="space-y-6">
 {/* Section Title */}
 <div className="flex items-center justify-between border-b border-border pb-4 ">
 <div>
 <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
 <MessageSquare className="text-emerald-500" size={24} />
 WhatsApp & SMS Gateway Settings
 </h2>
 <p className="text-sm text-muted-foreground mt-1">
 Manage your Render Evolution API WhatsApp connection and smart SMS fallback
 </p>
 </div>
 <button
 onClick={fetchStatus}
 disabled={loadingStatus}
 className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted "
 >
 <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
 Refresh Status
 </button>
 </div>

 {/* Main Grid: Status Card + Connection Controls */}
 <div className="grid gap-6 md:grid-cols-2">
 {/* Status Indicator Card */}
 <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm p-6 space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Instance Status</span>
 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
 isConnected
 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
 : isConnecting
 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
 : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
 }`}>
 {isConnected ? <CheckCircle2 size={13} /> : isConnecting ? <RefreshCw size={13} className="animate-spin" /> : <AlertCircle size={13} />}
 {isConnected ? 'Connected' : isConnecting ? 'Connecting…' : 'Disconnected'}
 </div>
 </div>

 <div className="space-y-2">
 <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <span>{status.instanceName}</span>
 {isConnected && <ShieldCheck className="text-emerald-500" size={20} />}
 </h3>
 <p className="text-xs text-muted-foreground ">
 Host: <code className="font-mono bg-muted px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">https://shams-sms-whatsapp.onrender.com</code>
 </p>
 <p className="text-xs text-muted-foreground ">
 Session Store: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Neon PostgreSQL (Persistent)</span>
 </p>
 </div>

 <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 text-xs space-y-1.5 text-indigo-900 dark:text-indigo-200">
 <div className="flex items-center gap-2 font-semibold">
 <Sparkles size={14} className="text-indigo-500" />
 <span>Smart WA-First Delivery Enabled</span>
 </div>
 <p className="text-indigo-700 dark:text-indigo-300">
 Messages try WhatsApp first. If the recipient isn&apos;t on WhatsApp or service is down, it automatically falls back to <strong>Textbee SMS</strong>.
 </p>
 </div>

 {/* Action Buttons */}
 <div className="pt-2">
 {!isConnected ? (
 <button
 onClick={handleConnectQr}
 disabled={loadingQr}
 className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
 >
 <QrCode size={18} />
 {loadingQr ? 'Generating QR Code…' : 'Connect / Show QR Code'}
 </button>
 ) : (
 <button
 onClick={handleDisconnect}
 className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 transition hover:bg-rose-100 dark:hover:bg-rose-900/40"
 >
 <LogOut size={14} />
 Disconnect WhatsApp Instance
 </button>
 )}
 </div>
 </div>

 {/* QR Code / Instructions Container */}
 <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm p-6 flex flex-col justify-center items-center text-center">
 {isConnected ? (
 <div className="space-y-3 py-6">
 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
 <CheckCircle2 size={36} />
 </div>
 <h4 className="text-lg font-bold text-foreground ">WhatsApp Connected!</h4>
 <p className="text-xs text-muted-foreground max-w-xs mx-auto">
 Your device is linked and session keys are saved in Neon DB. Your institute is ready to send instant notifications.
 </p>
 </div>
 ) : qrCodeData?.base64 ? (
 <div className="space-y-4 py-2">
 <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Scan with WhatsApp</p>
 <div className="p-3 bg-card rounded-2xl inline-block shadow-md border border-border">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={qrCodeData.base64.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`}
 alt="WhatsApp QR Code"
 className="w-56 h-56 mx-auto object-contain"
 />
 </div>
 {qrCodeData.pairingCode && (
 <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full inline-block">
 Pairing Code: {qrCodeData.pairingCode}
 </p>
 )}
 <div className="text-xs text-muted-foreground space-y-1">
 <p>1. Open WhatsApp on phone → <strong>Settings</strong></p>
 <p>2. Tap <strong>Linked Devices</strong> → <strong>Link a Device</strong></p>
 <p>3. Point camera at screen</p>
 </div>
 </div>
 ) : (
 <div className="space-y-3 py-6 text-muted-foreground">
 <Smartphone size={44} className="mx-auto opacity-40" />
 <p className="text-sm font-semibold text-foreground ">Device Pairing Required</p>
 <p className="text-xs max-w-xs mx-auto text-muted-foreground ">
 Click &quot;Connect / Show QR Code&quot; on the left to generate an active pairing QR code.
 </p>
 {qrError && (
 <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
 {qrError}
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Quick Test Message Dispatcher */}
 <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm p-6">
 <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
 <Send size={18} className="text-indigo-500" />
 Gateway Test Dispatcher
 </h3>

 <form onSubmit={handleSendTest} className="space-y-4">
 <div className="grid gap-4 sm:grid-cols-3">
 <div>
 <label className="block text-xs font-semibold text-foreground mb-1">
 Recipient Phone
 </label>
 <input
 type="text"
 placeholder="e.g. 03001234567"
 value={testPhone}
 onChange={(e) => setTestPhone(e.target.value)}
 className="w-full rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500"
 required
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-foreground mb-1">
 Mode Strategy
 </label>
 <select
 value={testChannel}
 onChange={(e) => setTestChannel(e.target.value as any)}
 className="w-full rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 font-medium"
 >
 <option value="SMART">WhatsApp First → SMS Fallback (Recommended)</option>
 <option value="WHATSAPP">WhatsApp Only</option>
 <option value="SMS">Textbee SMS Only</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-foreground mb-1">
 Action
 </label>
 <button
 type="submit"
 disabled={sendingTest || !testPhone}
 className="w-full rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {sendingTest ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
 {sendingTest ? 'Dispatching…' : 'Send Test Message'}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-foreground mb-1">
 Message Content
 </label>
 <textarea
 rows={2}
 value={testMsg}
 onChange={(e) => setTestMsg(e.target.value)}
 className="w-full rounded-2xl border border-border bg-muted p-3 text-sm text-foreground outline-none focus:border-indigo-500"
 />
 </div>
 </form>

 {testResult && (
 <div className={`mt-4 p-4 rounded-2xl border text-xs ${
 testResult.success
 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
 : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
 }`}>
 <div className="flex items-center justify-between font-bold">
 <span>{testResult.success ? '✅ Test Message Delivered!' : '❌ Dispatch Failed'}</span>
 {testResult.channelUsed && (
 <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px]">
 Channel: {testResult.channelUsed}
 </span>
 )}
 </div>
 {testResult.error && <p className="mt-1">{testResult.error}</p>}
 {testResult.id && <p className="mt-1 opacity-75 font-mono">Message ID: {testResult.id}</p>}
 </div>
 )}
 </div>
 </div>
 )
}
