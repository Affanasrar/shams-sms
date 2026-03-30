const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  const studentId = 'SCI-2602-013'
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: { fees: { orderBy: { cycleDate: 'asc' } } }
  })

  if (!student) {
    console.log('Student not found:', studentId)
    await prisma.$disconnect()
    return
  }

  console.log('Student:', student.name, 'ID:', student.studentId)
  console.log('Total fees count:', student.fees.length)
  for (const fee of student.fees) {
    console.log(fee.cycleDate.toISOString().split('T')[0], fee.status, Number(fee.finalAmount))
  }
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
