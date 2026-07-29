// lib/evolution-api.ts

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || 'https://shams-sms-whatsapp.onrender.com').replace(/\/$/, '')
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Lenovot560@'
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'shams-whatsapp'

export function normalizeWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/[^+0-9]/g, '')

  if (!digits) return null

  let clean = digits.startsWith('+') ? digits.slice(1) : digits

  if (clean.startsWith('00')) {
    clean = clean.slice(2)
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = `92${clean.slice(1)}`
  } else if (clean.length === 10) {
    clean = `92${clean}`
  }

  return clean
}

export type WhatsAppConnectionState = 'open' | 'connecting' | 'close' | 'unknown'

export type InstanceStatusResponse = {
  success: boolean
  state: WhatsAppConnectionState
  instanceName: string
  error?: string
}

export type QrCodeResponse = {
  success: boolean
  pairingCode?: string
  code?: string
  base64?: string
  error?: string
}

export type SendWhatsAppResponse = {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Fetch connection state for the configured WhatsApp instance
 */
export async function getWhatsAppConnectionState(): Promise<InstanceStatusResponse> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return { success: false, state: 'unknown', instanceName: EVOLUTION_INSTANCE_NAME, error: 'Evolution API credentials missing' }
  }

  const endpoint = `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (res.status === 404) {
      return { success: true, state: 'close', instanceName: EVOLUTION_INSTANCE_NAME }
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { success: false, state: 'unknown', instanceName: EVOLUTION_INSTANCE_NAME, error: `API ${res.status}: ${errText.slice(0, 100)}` }
    }

    const data = await res.json()
    const state: WhatsAppConnectionState = (data?.instance?.state || data?.state || 'close').toLowerCase() as WhatsAppConnectionState

    return {
      success: true,
      state,
      instanceName: EVOLUTION_INSTANCE_NAME,
    }
  } catch (err) {
    console.error('Failed to get WhatsApp connection state:', err)
    return {
      success: false,
      state: 'unknown',
      instanceName: EVOLUTION_INSTANCE_NAME,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

/**
 * Create or connect the instance and retrieve the QR code
 */
export async function connectWhatsAppInstance(): Promise<QrCodeResponse> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return { success: false, error: 'Evolution API credentials missing' }
  }

  try {
    // 1. Try to create the instance if it doesn't exist
    const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: EVOLUTION_INSTANCE_NAME,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
      cache: 'no-store',
    })

    if (createRes.ok) {
      const createData = await createRes.json()
      const qrcodeData = createData?.qrcode
      if (qrcodeData?.base64) {
        return {
          success: true,
          code: qrcodeData.code,
          base64: qrcodeData.base64,
          pairingCode: qrcodeData.pairingCode,
        }
      }
    }

    // 2. If creation fails or instance already exists, call connect
    const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
      cache: 'no-store',
    })

    if (!connectRes.ok) {
      const errText = await connectRes.text().catch(() => '')
      return { success: false, error: `Connect failed (${connectRes.status}): ${errText.slice(0, 100)}` }
    }

    const connectData = await connectRes.json()
    const base64 = connectData?.base64 || connectData?.qrcode?.base64
    const code = connectData?.code || connectData?.qrcode?.code
    const pairingCode = connectData?.pairingCode || connectData?.qrcode?.pairingCode

    return {
      success: true,
      base64,
      code,
      pairingCode,
    }
  } catch (err) {
    console.error('Error connecting WhatsApp instance:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

/**
 * Check if a phone number is registered on WhatsApp
 */
export async function isNumberOnWhatsApp(phone: string): Promise<boolean> {
  const number = normalizeWhatsAppNumber(phone)
  if (!number) return false

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numbers: [number],
      }),
      cache: 'no-store',
    })

    if (!res.ok) return false

    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return Boolean(data[0]?.exists)
    }

    if (data?.exists !== undefined) {
      return Boolean(data.exists)
    }

    return true // Assume true if check API signature differs
  } catch (err) {
    console.warn('WhatsApp number verification check error:', err)
    return true // Fall back to attempting send if check fails
  }
}

/**
 * Send a text message via WhatsApp (Evolution API)
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendWhatsAppResponse> {
  const recipient = normalizeWhatsAppNumber(phone)
  if (!recipient) {
    return { success: false, error: 'Invalid phone number format' }
  }

  const endpoint = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000) // 12s timeout

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: recipient,
        text,
        options: {
          delay: 1200,
          presence: 'composing',
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`WhatsApp send failed (${res.status}): ${errText.slice(0, 150)}`)
      return { success: false, error: `WhatsApp API error ${res.status}` }
    }

    const data = await res.json()
    const messageId = data?.key?.id || data?.id || data?.messageId || null

    return {
      success: true,
      messageId,
    }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'WhatsApp request timeout' }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

/**
 * Send a document/PDF file via WhatsApp (Evolution API)
 */
export async function sendWhatsAppDocument(
  phone: string,
  pdfBuffer: Buffer,
  fileName: string,
  caption: string
): Promise<SendWhatsAppResponse> {
  const recipient = normalizeWhatsAppNumber(phone)
  if (!recipient) {
    return { success: false, error: 'Invalid phone number format' }
  }

  const endpoint = `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE_NAME}`
  const base64Data = pdfBuffer.toString('base64')
  const mediaDataUrl = `data:application/pdf;base64,${base64Data}`

  // Try raw base64 first (preferred by Evolution API v2), then data URI format
  for (const mediaPayload of [base64Data, mediaDataUrl]) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: recipient,
          mediatype: 'document',
          mimetype: 'application/pdf',
          media: mediaPayload,
          fileName: fileName || 'Fee_Voucher.pdf',
          filename: fileName || 'Fee_Voucher.pdf',
          caption: caption || '',
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const messageId = data?.key?.id || data?.id || data?.messageId || null
        console.log(`✅ WhatsApp PDF Document sent successfully to ${recipient} (Message ID: ${messageId})`)
        return { success: true, messageId }
      }

      const errText = await res.text().catch(() => '')
      console.warn(`WhatsApp sendMedia attempt with payload length ${mediaPayload.length} failed (${res.status}): ${errText.slice(0, 150)}`)
    } catch (err) {
      clearTimeout(timeoutId)
      console.warn('WhatsApp sendMedia error:', err)
    }
  }

  return { success: false, error: 'WhatsApp media upload failed' }
}

/**
 * Logout / Disconnect WhatsApp instance
 */
export async function logoutWhatsAppInstance(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${EVOLUTION_INSTANCE_NAME}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
      cache: 'no-store',
    })

    if (res.ok || res.status === 404) {
      return { success: true }
    }

    return { success: false, error: `Logout status ${res.status}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

