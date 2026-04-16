// app/api/admin/student-fees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { serializeDecimals } from '@/lib/serialize-decimals'
import { verifyAdminApiRole } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ ROLE VERIFICATION: Verify admin access
  const { isAdmin } = await verifyAdminApiRole()
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }
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

    return NextResponse.json(serializeDecimals(student))
  } catch (error) {
    console.error('Get student fees error:', error)
    return NextResponse.json({ error: 'Failed to get student fees' }, { status: 500 })
  }
}