import { sendWhatsAppMessage, sendWhatsAppDocument, isNumberOnWhatsApp, getWhatsAppConnectionState } from '@/lib/evolution-api'
import { sendTextbeeSms } from '@/lib/textbee'

export type DeliveryChannel = 'WHATSAPP' | 'SMS_FALLBACK' | 'SMS'

export type SmartMessageResult = {
  success: boolean
  channelUsed: DeliveryChannel
  id?: string | null
  error?: string
  fallbackReason?: string
}

export type PreferredChannel = 'SMART' | 'WHATSAPP' | 'SMS'

/**
 * Smart Message Dispatcher:
 * Tries WhatsApp first. If recipient is not on WhatsApp or WhatsApp is disconnected,
 * automatically falls back to Textbee SMS.
 */
export async function sendSmartMessage(
  phone: string,
  message: string,
  preferredChannel: PreferredChannel = 'SMART'
): Promise<SmartMessageResult> {
  // If explicitly requested SMS only
  if (preferredChannel === 'SMS') {
    const smsResult = await sendTextbeeSms(phone, message)
    return {
      success: smsResult.success,
      channelUsed: 'SMS',
      id: smsResult.textbeeId,
      error: smsResult.error,
    }
  }

  // Attempt WhatsApp first (for SMART or WHATSAPP)
  try {
    const connState = await getWhatsAppConnectionState()

    if (connState.state === 'open') {
      const existsOnWa = await isNumberOnWhatsApp(phone)

      if (existsOnWa) {
        const waResult = await sendWhatsAppMessage(phone, message)
        if (waResult.success) {
          return {
            success: true,
            channelUsed: 'WHATSAPP',
            id: waResult.messageId,
          }
        } else {
          console.warn(`WhatsApp send failed for ${phone}. Falling back to Textbee SMS. Reason: ${waResult.error}`)
        }
      } else {
        console.info(`Number ${phone} is not on WhatsApp. Falling back to Textbee SMS.`)
      }
    } else {
      console.warn(`WhatsApp connection is ${connState.state}. Falling back to Textbee SMS.`)
    }
  } catch (waErr) {
    console.error('Error during WhatsApp dispatch attempt:', waErr)
  }

  // If force WhatsApp was selected and failed without fallback permission
  if (preferredChannel === 'WHATSAPP') {
    return {
      success: false,
      channelUsed: 'WHATSAPP',
      error: 'WhatsApp dispatch failed and SMS fallback disabled for explicit WhatsApp channel selection',
    }
  }

  // Fallback to Textbee SMS
  console.info(`[Fallback Dispatch] Sending SMS via Textbee to ${phone}`)
  const fallbackSmsResult = await sendTextbeeSms(phone, message)

  return {
    success: fallbackSmsResult.success,
    channelUsed: 'SMS_FALLBACK',
    id: fallbackSmsResult.textbeeId,
    error: fallbackSmsResult.error,
    fallbackReason: 'WhatsApp unavailable or number not registered on WhatsApp',
  }
}

/**
 * Smart Document Dispatcher:
 * Sends PDF document via WhatsApp. If unavailable or not on WA, sends text summary via Textbee SMS.
 */
export async function sendSmartDocument(
  phone: string,
  pdfBuffer: Buffer,
  fileName: string,
  caption: string
): Promise<SmartMessageResult> {
  try {
    const connState = await getWhatsAppConnectionState()

    if (connState.state === 'open') {
      const existsOnWa = await isNumberOnWhatsApp(phone)
      if (existsOnWa) {
        // 1. Attempt sending PDF Document Attachment over WhatsApp
        const waDocResult = await sendWhatsAppDocument(phone, pdfBuffer, fileName, caption)
        if (waDocResult.success) {
          return {
            success: true,
            channelUsed: 'WHATSAPP',
            id: waDocResult.messageId,
          }
        }

        console.warn(`WhatsApp PDF attachment send failed for ${phone} (${waDocResult.error}). Attempting WhatsApp text fallback...`)

        // 2. Fallback to WhatsApp Text Message (Voucher Details) over WhatsApp
        const waTextResult = await sendWhatsAppMessage(phone, caption)
        if (waTextResult.success) {
          console.log(`✅ Sent WhatsApp text voucher fallback to ${phone}`)
          return {
            success: true,
            channelUsed: 'WHATSAPP',
            id: waTextResult.messageId,
          }
        }
      } else {
        console.info(`Number ${phone} is not registered on WhatsApp. Falling back to Textbee SMS.`)
      }
    } else {
      console.warn(`WhatsApp instance state is ${connState.state}. Falling back to Textbee SMS.`)
    }
  } catch (err) {
    console.error('Error during WhatsApp document/text dispatch:', err)
  }

  // 3. Final Fallback: Send caption via Textbee SMS
  console.info(`[Document Fallback] Sending text summary via Textbee SMS to ${phone}`)
  const smsResult = await sendTextbeeSms(phone, caption)
  return {
    success: smsResult.success,
    channelUsed: 'SMS_FALLBACK',
    id: smsResult.textbeeId,
    error: smsResult.error,
    fallbackReason: 'WhatsApp media and text dispatches unavailable',
  }
}

