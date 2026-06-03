const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const phone = '03328839937'
  const student = await prisma.student.findFirst({
    where: { phone },
    include: {
      enrollments: {
        include: {
          courseOnSlot: { include: { course: true, slot: true } }
        }
      },
      smsMessages: true
    }
  })

  if (!student) {
    console.log(`No student found with phone ${phone}`)
    await prisma.$disconnect()
    return
  }

  console.log(`\nStudent: ${student.name} (${student.phone}) - id: ${student.id}\n`)

  console.log('Enrollments:')
  for (const e of student.enrollments) {
    console.log('---')
    console.log(`enrollmentId: ${e.id}`)
    console.log(`course: ${e.courseOnSlot?.course?.name}`)
    if (e.courseOnSlot?.slot) {
      console.log(`slotId: ${e.courseOnSlot.slot.id}`)
      console.log(`slot start: ${new Date(e.courseOnSlot.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}`)
      console.log(`slot end:   ${new Date(e.courseOnSlot.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}`)
    }
    console.log(`joiningDate: ${e.joiningDate}`)
  }

  console.log('\nSmsMessages:')
  for (const s of student.smsMessages) {
    console.log('---')
    console.log(`id: ${s.id}`)
    console.log(`createdAt: ${s.createdAt}`)
    console.log(`sentAt: ${s.sentAt}`)
    console.log(`message: ${s.message}`)
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect().then(() => process.exit(1))
})
