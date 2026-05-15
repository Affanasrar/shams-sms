const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID
const TEXTBEE_BASE_URL = process.env.TEXTBEE_BASE_URL || 'https://api.textbee.dev'

function normalizePhoneNumber(phone: string): string | null {
  const digits = phone.replace(/[^+0-9]/g, '')

  if (!digits) {
    return null
  }

  if (digits.startsWith('+')) {
    return digits
  }

  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`
  }

  if (digits.startsWith('0')) {
    const rest = digits.slice(1)
    if (rest.length === 10) {
      return `+92${rest}`
    }
  }

  if (digits.length === 10) {
    return `+92${digits}`
  }

  if (digits.length === 11 && digits.startsWith('92')) {
    return `+${digits}`
  }

  return digits
}

type TextbeeResponse = {
  success: boolean
  error?: string
  textbeeId?: string | null
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
}

function isValidSmsStatus(status: unknown): status is 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' {
  return ['PENDING', 'SENT', 'DELIVERED', 'FAILED'].includes(String(status))
}

export async function sendTextbeeSms(phone: string, message: string): Promise<TextbeeResponse> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn('Textbee SMS skipped: TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID is not configured.')
    return { success: false, error: 'SMS service not configured' }
  }

  const recipient = normalizePhoneNumber(phone)
  if (!recipient) {
    return { success: false, error: 'Invalid phone number format' }
  }

  const endpoint = `${TEXTBEE_BASE_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEXTBEE_API_KEY,
      },
      body: JSON.stringify({
        recipients: [recipient],
        message,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const responseText = await response.text().catch(() => 'Unable to read response')
      const truncatedError = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText
      console.error(`Textbee SMS failed: ${response.status} - ${truncatedError}`)
      return { success: false, error: `API error: ${response.status}` }
    }

    let result
    try {
      result = await response.json()
    } catch (parseError) {
      console.error('Failed to parse Textbee response:', parseError)
      return { success: false, error: 'Invalid API response format' }
    }

    // Safely extract values with validation
    const textbeeId = result.data?._id || result._id || null
    const apiStatus = result.data?.status || result.status || 'PENDING'
    const status = isValidSmsStatus(apiStatus) ? apiStatus : 'PENDING'

    return { 
      success: true, 
      textbeeId,
      status
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Textbee SMS request timeout after 10s')
      return { success: false, error: 'Request timeout' }
    }
    
    console.error('Textbee SMS request failed:', error instanceof Error ? error.message : String(error))
    return { success: false, error: 'Network error' }
  }
}
