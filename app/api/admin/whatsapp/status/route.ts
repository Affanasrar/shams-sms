// app/api/admin/whatsapp/status/route.ts
import { NextResponse } from 'next/server'
import { getWhatsAppConnectionState, connectWhatsAppInstance, logoutWhatsAppInstance } from '@/lib/evolution-api'

export const dynamic = 'force-dynamic'

export async function GET() {
 try {
 const status = await getWhatsAppConnectionState()
 return NextResponse.json(status)
 } catch (error) {
 return NextResponse.json(
 { success: false, state: 'unknown', error: error instanceof Error ? error.message : 'Internal Server Error' },
 { status: 500 }
 )
 }
}

export async function POST() {
 try {
 const result = await connectWhatsAppInstance()
 return NextResponse.json(result)
 } catch (error) {
 return NextResponse.json(
 { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
 { status: 500 }
 )
 }
}

export async function DELETE() {
 try {
 const result = await logoutWhatsAppInstance()
 return NextResponse.json(result)
 } catch (error) {
 return NextResponse.json(
 { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
 { status: 500 }
 )
 }
}
