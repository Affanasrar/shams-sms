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

export async function sendTextbeeSms(phone: string, message: string) {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn('Textbee SMS skipped: TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID is not configured.')
    return false
  }

  const recipient = normalizePhoneNumber(phone)
  if (!recipient) {
    console.warn(`Textbee SMS skipped: invalid phone number "${phone}".`)
    return false
  }

  const endpoint = `${TEXTBEE_BASE_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`

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
    })

    if (!response.ok) {
      const responseText = await response.text().catch(() => 'Unable to read response body')
      console.error(`Textbee SMS failed: ${response.status} ${response.statusText} - ${responseText}`)
      return false
    }

    return true
  } catch (error) {
    console.error('Textbee SMS request failed:', error)
    return false
  }
}
