import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { smsReminderEnabled } = body

    if (typeof smsReminderEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid smsReminderEnabled value' }, { status: 400 })
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { smsReminderEnabled }
    })

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}