import prisma from './lib/prisma.js'

async function debugFees() {
  // Get recent fees
  const fees = await prisma.fee.findMany({
    where: {
      cycleDate: {
        gte: new Date(2026, 1, 1), // Feb 1
      }
    },
    take: 50
  })

  // Get student names separately
  const studentMap = new Map()
  for (const fee of fees) {
    if (!studentMap.has(fee.studentId)) {
      const student = await prisma.student.findUnique({
        where: { id: fee.studentId }
      })
      studentMap.set(fee.studentId, student)
    }
  }

  console.log(`\n📊 Total fees found: ${fees.length}\n`)

  // Group by enrollment and cycle date
  const grouped: { [key: string]: typeof fees } = {}
  
  for (const fee of fees) {
    const key = `${fee.enrollmentId}-${fee.cycleDate.toISOString().split('T')[0]}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(fee)
  }

  // Show duplicates
  for (const key in grouped) {
    const groupFees = grouped[key]
    if (groupFees.length > 1) {
      const first = groupFees[0]
      const student = studentMap.get(first.studentId)
      console.log(`⚠️ DUPLICATE FOUND: Enrollment ${first.enrollmentId}`)
      console.log(`   Student: ${student?.name}`)
      console.log(`   Cycle Date: ${first.cycleDate.toISOString().split('T')[0]}`)
      console.log(`   Count: ${groupFees.length}`)
      groupFees.forEach((f, i) => {
        console.log(`   [${i + 1}] Amount: ${f.finalAmount} | Discount: ${f.discountAmount}`)
      })
      console.log()
    }
  }

  // Show all fees with details
  console.log('\n📋 All Fees Details:')
  fees.forEach(fee => {
    const student = studentMap.get(fee.studentId)
    console.log(`${student?.name} | Cycle: ${fee.cycleDate.toISOString().split('T')[0]} | Due: ${fee.dueDate.toISOString().split('T')[0]} | Amount: ${fee.finalAmount} | Discount: ${fee.discountAmount}`)
  })
}

debugFees().catch(e => {
  console.error('Error:', e)
  process.exit(1)
}).then(() => {
  process.exit(0)
})
