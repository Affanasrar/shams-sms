// app/api/admin/whatsapp/send/route.ts
import { NextResponse } from 'next/server'
import { sendSmartMessage, PreferredChannel } from '@/lib/messaging'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, message, channel } = body

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'Phone and message are required' }, { status: 400 })
    }

    const preferredChannel: PreferredChannel = (channel as PreferredChannel) || 'SMART'

    const result = await sendSmartMessage(phone, message, preferredChannel)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
