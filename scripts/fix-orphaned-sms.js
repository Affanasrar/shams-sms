#!/usr/bin/env node
/**
 * Fix orphaned inbound SMS messages by linking them to students
 * 
 * Problem: Inbound SMS messages with null studentId won't appear in the messaging interface
 * Solution: Match inbound SMS phone numbers to student phone numbers
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalizePhoneNumber(phone) {
  const digits = phone.replace(/[^+0-9]/g, '')

  if (!digits) {
    return null
  }

  if (digits.startsWith('+')) {
    return digits
  }

  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`
  }

  if (digits.startsWith('0')) {
    const rest = digits.slice(1)
    if (rest.length === 10) {
      return `+92${rest}`
    }
  }

  if (digits.length === 10) {
    return `+92${digits}`
  }

  if (digits.length === 11 && digits.startsWith('92')) {
    return `+${digits}`
  }

  return digits
}

async function fixOrphanedSms() {
  console.log('🔍 Starting to fix orphaned SMS messages...\n')

  try {
    // Get all inbound SMS with null studentId
    const orphanedSms = await prisma.smsMessage.findMany({
      where: {
        direction: 'INBOUND',
        studentId: null,
      },
      select: {
        id: true,
        phoneNumber: true,
        message: true,
        createdAt: true,
      },
    })

    console.log(`Found ${orphanedSms.length} orphaned inbound SMS messages\n`)

    if (orphanedSms.length === 0) {
      console.log('✅ No orphaned SMS to fix!')
      return
    }

    let fixed = 0
    let notFound = 0

    for (const sms of orphanedSms) {
      const normalizedPhone = normalizePhoneNumber(sms.phoneNumber)

      if (!normalizedPhone) {
        console.log(`⚠️  [${sms.id}] Could not normalize phone: ${sms.phoneNumber}`)
        notFound++
        continue
      }

      // Try to find student with this phone
      const student = await prisma.student.findFirst({
        where: {
          phone: {
            in: [normalizedPhone, sms.phoneNumber],
          },
        },
        select: { id: true, name: true, phone: true },
      })

      if (student) {
        // Update SMS with studentId
        await prisma.smsMessage.update({
          where: { id: sms.id },
          data: { studentId: student.id },
        })

        console.log(
          `✅ [${sms.id}] Linked SMS from ${sms.phoneNumber} to student: ${student.name} (${student.phone})`
        )
        fixed++
      } else {
        console.log(
          `❌ [${sms.id}] No student found for phone ${sms.phoneNumber} (normalized: ${normalizedPhone})`
        )
        notFound++
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log(`Summary:`)
    console.log(`  ✅ Fixed: ${fixed} SMS messages`)
    console.log(`  ❌ Not found: ${notFound} SMS messages`)
    console.log('='.repeat(70))

    if (notFound > 0) {
      console.log('\n⚠️  Warning: Some SMS messages could not be linked to students.')
      console.log('These may be from numbers not in the student database.')
    }
  } catch (error) {
    console.error('❌ Error fixing orphaned SMS:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixOrphanedSms()
