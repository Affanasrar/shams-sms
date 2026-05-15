import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { normalizePhoneNumber } from '@/lib/textbee'

const TEXTBEE_WEBHOOK_SECRET = process.env.TEXTBEE_WEBHOOK_SECRET

type WebhookEvent = 
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_FAILED'

interface TextbeeWebhookPayload {
  webhookEvent: WebhookEvent
  smsId: string
  smsBatchId?: string
  batchId?: string
  sender?: string
  recipient?: string
  message: string
  status?: 'sent' | 'delivered' | 'failed'
  deviceId: string
  receivedAt?: string
  sentAt?: string
  deliveredAt?: string
  failedAt?: string
  errorCode?: string
  errorMessage?: string
  phoneNumber?: string
}

function verifyWebhookSignature(payloadBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) {
    console.warn('Missing X-Signature header')
    return false
  }

  const normalizedSignature = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature

  const digest = crypto.createHmac('sha256', secret).update(payloadBody).digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(normalizedSignature, 'hex'),
      Buffer.from(digest, 'hex')
    )
  } catch {
    return false
  }
}

async function handleMessageReceived(payload: TextbeeWebhookPayload) {
  console.log('Handling MESSAGE_RECEIVED:', payload)

  try {
    const phoneNumber = payload.sender || payload.phoneNumber || ''
    if (!phoneNumber) {
      console.warn('MESSAGE_RECEIVED payload has no sender or phoneNumber:', payload)
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    
    let studentId: string | null = null
    
    // Try to find student by normalized phone number
    if (normalizedPhone) {
      const student = await prisma.student.findFirst({
        where: {
          phone: {
            in: [normalizedPhone, phoneNumber] // Try both normalized and original
          }
        },
        select: { id: true }
      })
      if (student) {
        studentId = student.id
        console.log(`Found student ${studentId} for phone ${phoneNumber}`)
      } else {
        console.log(`No student found for phone ${phoneNumber} (normalized: ${normalizedPhone})`)
      }
    }

    // Create inbound SMS message record
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

    console.log('Inbound SMS recorded:', smsMessage.id, `(studentId: ${studentId || 'null'})`)
    return { success: true, message: 'Inbound SMS recorded', studentId }
  } catch (error) {
    console.error('Error recording inbound SMS:', error)
    throw error
  }
}

async function handleMessageSent(payload: TextbeeWebhookPayload) {
  console.log('Handling MESSAGE_SENT:', payload)

  try {
    // Update SMS status to SENT
    const updated = await prisma.smsMessage.updateMany({
      where: {
        textbeeId: payload.smsId,
      },
      data: {
        status: 'SENT',
        sentAt: payload.sentAt ? new Date(payload.sentAt) : new Date(),
      },
    })

    console.log(`Updated ${updated.count} SMS record(s) to SENT status`)
    return { success: true, message: 'SMS marked as sent' }
  } catch (error) {
    console.error('Error updating SMS sent status:', error)
    throw error
  }
}

async function handleMessageDelivered(payload: TextbeeWebhookPayload) {
  console.log('Handling MESSAGE_DELIVERED:', payload)

  try {
    // Update SMS status to DELIVERED
    const updated = await prisma.smsMessage.updateMany({
      where: {
        textbeeId: payload.smsId,
      },
      data: {
        status: 'DELIVERED',
        sentAt: payload.sentAt ? new Date(payload.sentAt) : undefined,
        deliveredAt: payload.deliveredAt ? new Date(payload.deliveredAt) : new Date(),
      },
    })

    console.log(`Updated ${updated.count} SMS record(s) to DELIVERED status`)
    return { success: true, message: 'SMS marked as delivered' }
  } catch (error) {
    console.error('Error updating SMS delivered status:', error)
    throw error
  }
}

async function handleMessageFailed(payload: TextbeeWebhookPayload) {
  console.log('Handling MESSAGE_FAILED:', payload)

  try {
    // Update SMS status to FAILED
    const updated = await prisma.smsMessage.updateMany({
      where: {
        textbeeId: payload.smsId,
      },
      data: {
        status: 'FAILED',
        failedAt: payload.failedAt ? new Date(payload.failedAt) : new Date(),
        errorMsg: payload.errorMessage ? `[${payload.errorCode}] ${payload.errorMessage}` : null,
      },
    })

    console.log(`Updated ${updated.count} SMS record(s) to FAILED status`)
    return { success: true, message: 'SMS marked as failed' }
  } catch (error) {
    console.error('Error updating SMS failed status:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret is configured
    if (!TEXTBEE_WEBHOOK_SECRET) {
      console.error('TEXTBEE_WEBHOOK_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      )
    }

    // Get signature from headers
    const signature = request.headers.get('x-signature')
    if (!signature) {
      console.warn('Missing X-Signature header in Textbee webhook')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Read raw request body and verify signature against raw JSON text
    const bodyText = await request.text()
    const payload = JSON.parse(bodyText) as TextbeeWebhookPayload

    // Verify signature
    if (!verifyWebhookSignature(bodyText, signature, TEXTBEE_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log(`Processing Textbee webhook event: ${payload.webhookEvent}`)

    // Route to appropriate handler
    let result
    switch (payload.webhookEvent) {
      case 'MESSAGE_RECEIVED':
        result = await handleMessageReceived(payload)
        break
      case 'MESSAGE_SENT':
        result = await handleMessageSent(payload)
        break
      case 'MESSAGE_DELIVERED':
        result = await handleMessageDelivered(payload)
        break
      case 'MESSAGE_FAILED':
        result = await handleMessageFailed(payload)
        break
      default:
        console.warn(`Unknown webhook event: ${payload.webhookEvent}`)
        result = { success: true, message: 'Event acknowledged' }
    }

    console.log('Webhook processed successfully:', result)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Textbee webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
