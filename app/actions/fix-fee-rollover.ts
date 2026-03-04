'use server'

import prisma from '@/lib/prisma'

/**
 * Recalculates rollover amounts for all fees to ensure cumulative unpaid balances are properly tracked
 * This fixes the bug where only the immediately previous month's unpaid amount was being rolled over
 */
export async function recalculateFeeRollovers() {
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

    // Process each enrollment
    for (const enrollmentId in groupedByEnrollment) {
      const enrollmentFees = groupedByEnrollment[enrollmentId]
      let cumulativeUnpaidBalance = 0

      // Process fees in chronological order
      for (let i = 0; i < enrollmentFees.length; i++) {
        const fee = enrollmentFees[i]
        const discountAmount = Number(fee.discountAmount)
        const courseBaseFee = Number(fee.enrollment?.courseOnSlot.course.baseFee || fee.amount)
        const baseAmountForMonth = courseBaseFee - discountAmount
        const unpaidPreviousBalance = cumulativeUnpaidBalance
        const expectedFinalAmount = baseAmountForMonth + unpaidPreviousBalance

        // Check if this fee's rollover is incorrect
        if (Number(fee.rolloverAmount) !== unpaidPreviousBalance) {
          console.log(`⚠️  Updating rollover for ${fee.enrollment?.student.name} (${fee.enrollment?.student.studentId})`)
          console.log(`   Cycle: ${fee.cycleDate.toISOString().split('T')[0]}, Old rollover: ${fee.rolloverAmount}, New rollover: ${unpaidPreviousBalance}`)

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
    return {
      success: true,
      message: `Recalculated ${feesUpdated} fees with correct rollover amounts`,
      feesUpdated
    }
  } catch (error) {
    console.error('❌ Fee rollover recalculation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during fee recalculation'
    }
  }
}
