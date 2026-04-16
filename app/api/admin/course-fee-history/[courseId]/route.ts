// app/api/admin/course-fee-history/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCourseFeeHistory } from '@/app/actions/course-fees'
import { verifyAdminApiRole } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
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
    const { courseId } = await params

    const result = await getCourseFeeHistory(courseId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.history)
  } catch (error) {
    console.error('Get course fee history error:', error)
    return NextResponse.json({ error: 'Failed to get fee history' }, { status: 500 })
  }
}