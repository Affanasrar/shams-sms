const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const enrollments = await prisma.enrollment.findMany({
    orderBy: { joiningDate: 'desc' },
    take: 30,
    include: {
      student: { select: { id: true, name: true, phone: true } },
      courseOnSlot: {
        include: {
          course: { select: { id: true, name: true } },
          slot: { select: { id: true, startTime: true, endTime: true, days: true } }
        }
      }
    }
  })

  console.log('\nRecent Enrollments (most recent joiningDate first):\n')
  enrollments.forEach(e => {
    console.log('---')
    console.log(`enrollmentId: ${e.id}`)
    console.log(`student: ${e.student?.name} (${e.student?.phone})`)
    console.log(`course: ${e.courseOnSlot?.course?.name}`)
    if (e.courseOnSlot?.slot) {
      console.log(`slotId: ${e.courseOnSlot.slot.id}`)
      console.log(`days: ${e.courseOnSlot.slot.days}`)
      console.log(`startTime: ${new Date(e.courseOnSlot.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}`)
      console.log(`endTime:   ${new Date(e.courseOnSlot.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}`)
    } else {
      console.log('slot: <none>')
    }
    console.log(`joiningDate: ${e.joiningDate}`)
    console.log('\n')
  })

  await prisma.$disconnect()
}

main().catch(e => {
  console.error('Error fetching enrollments:', e)
  prisma.$disconnect().then(() => process.exit(1))
})
