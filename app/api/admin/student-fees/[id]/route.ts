// app/api/admin/student-fees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            courseOnSlot: {
              include: {
                course: true
              }
            },
            fees: {
              orderBy: { dueDate: 'asc' }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Get student fees error:', error)
    return NextResponse.json({ error: 'Failed to get student fees' }, { status: 500 })
  }
}