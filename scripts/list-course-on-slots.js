const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: { include: { room: true } },
      teacher: true
    }
  })

  if (!assignments.length) {
    console.log('No course-on-slot assignments found.')
    await prisma.$disconnect()
    return
  }

  console.log('\nCourse-On-Slot Assignments:\n')
  assignments.forEach(a => {
    console.log(`ID: ${a.id}`)
    console.log(`Course: ${a.course?.name || a.courseId}`)
    console.log(`CourseId: ${a.courseId}`)
    console.log(`SlotId: ${a.slotId}`)
    if (a.slot) {
      console.log(`  Room: ${a.slot.room?.name || a.slot.roomId}`)
      console.log(`  Days: ${a.slot.days}`)
      console.log(`  Time: ${new Date(a.slot.startTime).toLocaleTimeString()} - ${new Date(a.slot.endTime).toLocaleTimeString()}`)
    }
    console.log(`Teacher: ${a.teacher ? `${a.teacher.firstName || ''} ${a.teacher.lastName || ''}`.trim() + ` (ID: ${a.teacherId})` : `Unassigned (ID: ${a.teacherId})`}`)
    console.log('---')
  })

  console.log(`\nTotal: ${assignments.length}\n`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
