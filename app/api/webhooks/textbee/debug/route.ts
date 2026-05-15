/**
 * DEBUG WEBHOOK - Use this to test if TextBee is sending requests
 * This version bypasses signature verification for debugging only
 * 
 * IMPORTANT: Only use this temporarily for debugging!
 * Delete or replace after identifying the issue.
 * 
 * Usage:
 * 1. Copy this to app/api/webhooks/textbee/debug/route.ts
 * 2. Send a test message via TextBee
 * 3. Check logs at: https://yourapp.com/api/webhooks/textbee/debug
 * 4. The endpoint will log all webhook requests and responses
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { normalizePhoneNumber } from '@/lib/textbee'

interface TextbeeWebhookPayload {
  webhookEvent: string
  smsId: string
  smsBatchId?: string
  batchId?: string
  sender?: string
  recipient?: string
  message: string
  status?: string
  deviceId: string
  receivedAt?: string
  sentAt?: string
  deliveredAt?: string
  failedAt?: string
  errorCode?: string
  errorMessage?: string
  phoneNumber?: string
}

// Store webhook logs in memory (temporary, for debugging)
const webhookLogs: Array<{
  timestamp: string
  event: string
  status: string
  details: string
}> = []

function addLog(event: string, status: string, details: string) {
  webhookLogs.push({
    timestamp: new Date().toISOString(),
    event,
    status,
    details
  })
  // Keep only last 100 logs
  if (webhookLogs.length > 100) {
    webhookLogs.shift()
  }
  console.log(`[WEBHOOK DEBUG] ${event} - ${status}: ${details}`)
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[WEBHOOK DEBUG] Incoming request')
    console.log('='.repeat(70))

    // Log headers
    const headers = Object.fromEntries(request.headers)
    console.log('[WEBHOOK DEBUG] Headers:', JSON.stringify(headers, null, 2))

    // Parse body
    let payload: TextbeeWebhookPayload
    try {
      payload = (await request.json()) as TextbeeWebhookPayload
      console.log('[WEBHOOK DEBUG] Payload:', JSON.stringify(payload, null, 2))
      addLog('RECEIVED', 'SUCCESS', `Event: ${payload.webhookEvent}`)
    } catch (e) {
      console.error('[WEBHOOK DEBUG] Failed to parse JSON body')
      addLog('RECEIVED', 'ERROR', 'Failed to parse JSON body')
      return NextResponse.json(
        { error: 'Invalid JSON body', log: webhookLogs },
        { status: 400 }
      )
    }

    // Route to handler based on event type
    let result: any = { success: false }

    switch (payload.webhookEvent) {
      case 'MESSAGE_RECEIVED':
        console.log('[WEBHOOK DEBUG] Processing MESSAGE_RECEIVED')
        try {
          const phoneNumber = payload.sender || ''
          const normalizedPhone = normalizePhoneNumber(phoneNumber)
          console.log(`[WEBHOOK DEBUG] Phone: ${phoneNumber}, Normalized: ${normalizedPhone}`)

          let studentId: string | null = null

          if (normalizedPhone) {
            const student = await prisma.student.findFirst({
              where: {
                phone: {
                  in: [normalizedPhone, phoneNumber]
                }
              },
              select: { id: true, name: true, phone: true }
            })
            if (student) {
              studentId = student.id
              console.log(`[WEBHOOK DEBUG] Found student: ${student.name} (${student.id})`)
              addLog('MESSAGE_RECEIVED', 'STUDENT_FOUND', `${student.name} (${student.phone})`)
            } else {
              console.log(`[WEBHOOK DEBUG] No student found for phone: ${phoneNumber}`)
              addLog('MESSAGE_RECEIVED', 'STUDENT_NOT_FOUND', `Phone: ${phoneNumber}`)
            }
          }

          const smsMessage = await prisma.smsMessage.create({
            data: {
              textbeeId: payload.smsId,
              phoneNumber: phoneNumber,
              message: payload.message,
              direction: 'INBOUND',
              status: 'DELIVERED',
              receivedAt: payload.receivedAt ? new Date(payload.receivedAt) : new Date(),
              deliveredAt: new Date(),
              studentId: studentId,
            },
          })

          console.log(`[WEBHOOK DEBUG] Created SMS: ${smsMessage.id}`)
          result = {
            success: true,
            message: 'Inbound SMS recorded',
            smsId: smsMessage.id,
            studentId: studentId
          }
          addLog('MESSAGE_RECEIVED', 'SUCCESS', `SMS created: ${smsMessage.id}`)
        } catch (error) {
          console.error('[WEBHOOK DEBUG] Error handling MESSAGE_RECEIVED:', error)
          addLog('MESSAGE_RECEIVED', 'ERROR', String(error))
          result = { success: false, error: String(error) }
        }
        break

      case 'MESSAGE_SENT':
        console.log('[WEBHOOK DEBUG] Processing MESSAGE_SENT')
        try {
          const updated = await prisma.smsMessage.updateMany({
            where: { textbeeId: payload.smsId },
            data: {
              status: 'SENT',
              sentAt: payload.sentAt ? new Date(payload.sentAt) : new Date(),
            },
          })
          console.log(`[WEBHOOK DEBUG] Updated ${updated.count} SMS to SENT`)
          result = { success: true, updated: updated.count }
          addLog('MESSAGE_SENT', 'SUCCESS', `Updated ${updated.count} records`)
        } catch (error) {
          console.error('[WEBHOOK DEBUG] Error handling MESSAGE_SENT:', error)
          addLog('MESSAGE_SENT', 'ERROR', String(error))
          result = { success: false, error: String(error) }
        }
        break

      case 'MESSAGE_DELIVERED':
        console.log('[WEBHOOK DEBUG] Processing MESSAGE_DELIVERED')
        try {
          const updated = await prisma.smsMessage.updateMany({
            where: { textbeeId: payload.smsId },
            data: {
              status: 'DELIVERED',
              deliveredAt: payload.deliveredAt ? new Date(payload.deliveredAt) : new Date(),
            },
          })
          console.log(`[WEBHOOK DEBUG] Updated ${updated.count} SMS to DELIVERED`)
          result = { success: true, updated: updated.count }
          addLog('MESSAGE_DELIVERED', 'SUCCESS', `Updated ${updated.count} records`)
        } catch (error) {
          console.error('[WEBHOOK DEBUG] Error handling MESSAGE_DELIVERED:', error)
          addLog('MESSAGE_DELIVERED', 'ERROR', String(error))
          result = { success: false, error: String(error) }
        }
        break

      case 'MESSAGE_FAILED':
        console.log('[WEBHOOK DEBUG] Processing MESSAGE_FAILED')
        try {
          const updated = await prisma.smsMessage.updateMany({
            where: { textbeeId: payload.smsId },
            data: {
              status: 'FAILED',
              failedAt: payload.failedAt ? new Date(payload.failedAt) : new Date(),
              errorMsg: payload.errorMessage || null,
            },
          })
          console.log(`[WEBHOOK DEBUG] Updated ${updated.count} SMS to FAILED`)
          result = { success: true, updated: updated.count }
          addLog('MESSAGE_FAILED', 'SUCCESS', `Updated ${updated.count} records`)
        } catch (error) {
          console.error('[WEBHOOK DEBUG] Error handling MESSAGE_FAILED:', error)
          addLog('MESSAGE_FAILED', 'ERROR', String(error))
          result = { success: false, error: String(error) }
        }
        break

      default:
        console.warn(`[WEBHOOK DEBUG] Unknown event: ${payload.webhookEvent}`)
        addLog('UNKNOWN', 'WARNING', `Event type: ${payload.webhookEvent}`)
        result = { success: true, message: 'Event acknowledged' }
    }

    const processingTime = Date.now() - startTime
    console.log(`[WEBHOOK DEBUG] Processing time: ${processingTime}ms`)
    console.log('[WEBHOOK DEBUG] Response:', result)
    console.log('='.repeat(70) + '\n')

    return NextResponse.json({
      ...result,
      processingTime,
      logs: webhookLogs
    }, { status: 200 })
  } catch (error) {
    console.error('[WEBHOOK DEBUG] Unhandled error:', error)
    addLog('UNHANDLED', 'ERROR', String(error))
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: String(error),
        logs: webhookLogs
      },
      { status: 500 }
    )
  }
}

// GET endpoint to view logs
export async function GET() {
  return NextResponse.json({
    message: 'Debug webhook active - waiting for messages',
    logsUrl: '/api/webhooks/textbee/debug/logs',
    logs: webhookLogs,
    totalLogs: webhookLogs.length
  })
}
