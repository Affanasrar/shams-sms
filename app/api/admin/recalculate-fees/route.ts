import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminApiRole } from '@/lib/auth-utils'

/**
 * API endpoint to recalculate rollover amounts for all fees
 * This fixes fees created before the bug was fixed
 * 
 * Only accepts POST requests from authenticated admin users
 */
export async function POST(request: NextRequest) {
  // ✅ ROLE VERIFICATION: Verify admin access
  const { isAdmin } = await verifyAdminApiRole()
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }
  try {
    console.log('🔄 Starting fee rollover recalculation...')

    // Get all fees, sorted by enrollment and cycle date
    const allFees = await prisma.fee.findMany({
      orderBy: [
        { enrollmentId: 'asc' },
        { cycleDate: 'asc' }
      ],
      include: {
        enrollment: {
          include: {
            student: true,
            courseOnSlot: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    let feesUpdated = 0
    let groupedByEnrollment: { [key: string]: typeof allFees } = {}

    // Group fees by enrollment
    for (const fee of allFees) {
      if (!groupedByEnrollment[fee.enrollmentId!]) {
        groupedByEnrollment[fee.enrollmentId!] = []
      }
      groupedByEnrollment[fee.enrollmentId!].push(fee)
    }

    const updateLog: string[] = []

    // Process each enrollment
    for (const enrollmentId in groupedByEnrollment) {
      const enrollmentFees = groupedByEnrollment[enrollmentId]
      let cumulativeUnpaidBalance = 0

      // Process fees in chronological order
      for (let i = 0; i < enrollmentFees.length; i++) {
        const fee = enrollmentFees[i]
        const discountAmount = Number(fee.discountAmount)
        // Keep original fee amount for historical rows, do not override by current course base fee
        const feeAmountAtMonth = Number(fee.amount)
        const baseAmountForMonth = feeAmountAtMonth - discountAmount
        const unpaidPreviousBalance = cumulativeUnpaidBalance
        // NEW LOGIC: finalAmount should NOT include rollover - each month stands alone
        const expectedFinalAmount = baseAmountForMonth  // No rollover in finalAmount

        // Check if this fee's rollover is incorrect (rolloverAmount should track previous balance for display)
        if (Number(fee.rolloverAmount) !== unpaidPreviousBalance || Number(fee.finalAmount) !== expectedFinalAmount) {
          const logEntry = `Updated ${fee.enrollment?.student.name} (${fee.enrollment?.student.studentId}): Cycle ${fee.cycleDate.toISOString().split('T')[0]}, Rollover: ${fee.rolloverAmount} → ${unpaidPreviousBalance}, FinalAmount: ${fee.finalAmount} → ${expectedFinalAmount}`
          console.log(`⚠️  ${logEntry}`)
          updateLog.push(logEntry)

          // Update the fee with correct rollover and final amount
          await prisma.fee.update({
            where: { id: fee.id },
            data: {
              rolloverAmount: unpaidPreviousBalance,
              finalAmount: expectedFinalAmount
            }
          })

          feesUpdated++
        }

        // Calculate unpaid balance for this month (to be rolled over to next month)
        const amountPaidThisMonth = Number(fee.paidAmount)
        const amountUnpaidThisMonth = expectedFinalAmount - amountPaidThisMonth
        cumulativeUnpaidBalance = Math.max(0, amountUnpaidThisMonth)
      }
    }

    console.log(`✅ Fee rollover recalculation completed: ${feesUpdated} fees updated`)
    
    return NextResponse.json({
      success: true,
      message: `Recalculated ${feesUpdated} fees with correct cumulative rollover amounts`,
      feesUpdated,
      totalFees: allFees.length,
      details: updateLog
    })
  } catch (error) {
    console.error('❌ Fee rollover recalculation failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during fee recalculation'
    }, { status: 500 })
  }
}
