// app/actions/student-cleanup.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Search for student by ID and get their fees and transactions
export async function searchStudentFees(studentId: string) {
  try {
    console.log(`🔍 Searching for student with ID: ${studentId}`)

    // Find student by their custom studentId (not UUID)
    const student = await prisma.student.findUnique({
      where: { studentId: studentId },
      include: {
        fees: {
          include: {
            transactions: {
              include: {
                collectedBy: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            enrollment: {
              include: {
                courseOnSlot: {
                  include: {
                    course: true,
                    slot: {
                      include: {
                        room: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            cycleDate: 'desc'
          }
        }
      }
    })

    if (!student) {
      return {
        success: false,
        error: `Student with ID "${studentId}" not found`
      }
    }

    // Calculate summary statistics
    const totalFees = student.fees.length
    const totalTransactions = student.fees.reduce((sum, fee) => sum + fee.transactions.length, 0)
    const totalAmount = student.fees.reduce((sum, fee) => sum + Number(fee.amount), 0)
    const totalPaid = student.fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
    const totalOutstanding = totalAmount - totalPaid

    console.log(`✅ Found student: ${student.name} (${student.studentId})`)
    console.log(`📊 Fees: ${totalFees}, Transactions: ${totalTransactions}, Outstanding: PKR ${totalOutstanding}`)

    return {
      success: true,
      data: {
        student: {
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          fatherName: student.fatherName,
          phone: student.phone,
          admission: student.admission
        },
        fees: student.fees,
        summary: {
          totalFees,
          totalTransactions,
          totalAmount,
          totalPaid,
          totalOutstanding
        }
      }
    }

  } catch (error) {
    console.error('❌ Error searching student fees:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Delete all fees and transactions for a student
export async function deleteStudentFees(studentId: string) {
  try {
    console.log(`🗑️ Starting deletion process for student ID: ${studentId}`)

    // First verify the student exists and get their data
    const searchResult = await searchStudentFees(studentId)
    if (!searchResult.success) {
      return searchResult
    }

    const studentData = searchResult.data!

    // Start transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      let deletedTransactions = 0
      let deletedFees = 0

      // Delete all transactions for each fee first (due to foreign key constraints)
      for (const fee of studentData.fees) {
        const transactionCount = await tx.transaction.deleteMany({
          where: { feeId: fee.id }
        })
        deletedTransactions += transactionCount.count
      }

      // Then delete all fees
      const feeDeletion = await tx.fee.deleteMany({
        where: { studentId: studentData.student.id }
      })
      deletedFees = feeDeletion.count

      console.log(`✅ Deleted ${deletedTransactions} transactions and ${deletedFees} fees for student ${studentId}`)
    })

    // Revalidate paths that might show this data
    revalidatePath('/admin/students')
    revalidatePath('/admin/fees')

    return {
      success: true,
      message: `Successfully deleted ${studentData.summary.totalTransactions} transactions and ${studentData.summary.totalFees} fees for student ${studentId}`,
      deletedData: {
        transactions: studentData.summary.totalTransactions,
        fees: studentData.summary.totalFees
      }
    }

  } catch (error) {
    console.error('❌ Error deleting student fees:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete student fees'
    }
  }
}

// Server action wrapper for useActionState
export async function searchStudentAction(prevState: any, formData: FormData) {
  const studentId = formData.get('studentId') as string

  if (!studentId || studentId.trim() === '') {
    return {
      success: false,
      error: 'Student ID is required'
    }
  }

  return await searchStudentFees(studentId.trim())
}

export async function deleteStudentFeesAction(prevState: any, formData: FormData) {
  const studentId = formData.get('studentId') as string

  if (!studentId || studentId.trim() === '') {
    return {
      success: false,
      error: 'Student ID is required'
    }
  }

  return await deleteStudentFees(studentId.trim())
}