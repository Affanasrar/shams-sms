// tests/unit/fee-calculation.test.ts
import { describe, it, expect } from 'vitest'

// Helper function that matches the cron job's discount active logic
function isDiscountActive(
  discount: { applicableFromMonth: number; applicableToMonth: number | null },
  monthNumber: number
): boolean {
  return (
    discount.applicableFromMonth <= monthNumber &&
    (discount.applicableToMonth === null || discount.applicableToMonth >= monthNumber)
  )
}

// Helper function to calculate final fee based on discount
function calculateDiscountedFee(
  baseFee: number,
  discount: { discountType: 'FIXED' | 'PERCENTAGE'; discountAmount: number } | null
): { discountAmount: number; finalAmount: number } {
  if (!discount) {
    return { discountAmount: 0, finalAmount: baseFee }
  }

  let discountAmount = 0
  if (discount.discountType === 'FIXED') {
    discountAmount = discount.discountAmount
  } else if (discount.discountType === 'PERCENTAGE') {
    discountAmount = baseFee * (discount.discountAmount / 100)
  }

  const finalAmount = Math.max(0, baseFee - discountAmount)
  return { discountAmount, finalAmount }
}

// Helper function to calculate rollover amount
function calculateRollover(
  previousFees: { finalAmount: number; paidAmount: number }[]
): number {
  return previousFees.reduce((sum, fee) => {
    const unpaid = fee.finalAmount - fee.paidAmount
    return sum + Math.max(0, unpaid)
  }, 0)
}

describe('Fee Calculation Helpers', () => {
  describe('isDiscountActive', () => {
    it('should be active when current month falls in single-month range', () => {
      const discount = { applicableFromMonth: 2, applicableToMonth: 2 }
      expect(isDiscountActive(discount, 1)).toBe(false)
      expect(isDiscountActive(discount, 2)).toBe(true)
      expect(isDiscountActive(discount, 3)).toBe(false)
    })

    it('should be active when current month falls in entire course range (null applicableToMonth)', () => {
      const discount = { applicableFromMonth: 1, applicableToMonth: null }
      expect(isDiscountActive(discount, 1)).toBe(true)
      expect(isDiscountActive(discount, 3)).toBe(true)
      expect(isDiscountActive(discount, 12)).toBe(true)
    })

    it('should be active within a multi-month range', () => {
      const discount = { applicableFromMonth: 2, applicableToMonth: 4 }
      expect(isDiscountActive(discount, 1)).toBe(false)
      expect(isDiscountActive(discount, 2)).toBe(true)
      expect(isDiscountActive(discount, 3)).toBe(true)
      expect(isDiscountActive(discount, 4)).toBe(true)
      expect(isDiscountActive(discount, 5)).toBe(false)
    })
  })

  describe('calculateDiscountedFee', () => {
    it('should return base fee when no discount exists', () => {
      const result = calculateDiscountedFee(5000, null)
      expect(result.discountAmount).toBe(0)
      expect(result.finalAmount).toBe(5000)
    })

    it('should apply FIXED discount correctly', () => {
      const discount = { discountType: 'FIXED' as const, discountAmount: 1200 }
      const result = calculateDiscountedFee(5000, discount)
      expect(result.discountAmount).toBe(1200)
      expect(result.finalAmount).toBe(3800)
    })

    it('should apply PERCENTAGE discount correctly', () => {
      const discount = { discountType: 'PERCENTAGE' as const, discountAmount: 25 }
      const result = calculateDiscountedFee(4000, discount)
      expect(result.discountAmount).toBe(1000)
      expect(result.finalAmount).toBe(3000)
    })

    it('should not allow final amount to be negative', () => {
      const discount = { discountType: 'FIXED' as const, discountAmount: 6000 }
      const result = calculateDiscountedFee(5000, discount)
      expect(result.finalAmount).toBe(0)
    })
  })

  describe('calculateRollover', () => {
    it('should return 0 when there are no previous unpaid fees', () => {
      const previousFees = [
        { finalAmount: 3000, paidAmount: 3000 },
        { finalAmount: 3000, paidAmount: 3000 },
      ]
      expect(calculateRollover(previousFees)).toBe(0)
    })

    it('should sum up unpaid balances from previous fees', () => {
      const previousFees = [
        { finalAmount: 3000, paidAmount: 1000 }, // 2000 unpaid
        { finalAmount: 3000, paidAmount: 0 },    // 3000 unpaid
        { finalAmount: 3000, paidAmount: 3000 }, // 0 unpaid
      ]
      expect(calculateRollover(previousFees)).toBe(5000)
    })

    it('should ignore negative unpaid values (e.g. overpayments)', () => {
      const previousFees = [
        { finalAmount: 3000, paidAmount: 3500 }, // -500 (overpaid, ignore or handle as 0 rollover)
        { finalAmount: 3000, paidAmount: 2000 }, // 1000 unpaid
      ]
      expect(calculateRollover(previousFees)).toBe(1000)
    })
  })
})
