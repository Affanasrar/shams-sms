const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const engPrefix = 'ENG-202512-'
  const sciPrefix = 'SCI-202512-'

  // Get current max SCI number
  const sci = await prisma.student.findMany({
    where: { studentId: { startsWith: sciPrefix } },
    select: { studentId: true }
  })

  let maxNum = 0
  for (const s of sci) {
    const numStr = s.studentId.slice(sciPrefix.length)
    const n = parseInt(numStr, 10)
    if (!isNaN(n) && n > maxNum) maxNum = n
  }

  console.log(`Last SCI number found: ${String(maxNum).padStart(3,'0')}`)

  // Fetch ENG students ordered ascending for stable renumbering
  const engStudents = await prisma.student.findMany({
    where: { studentId: { startsWith: engPrefix } },
    orderBy: { studentId: 'asc' }
  })

  if (!engStudents.length) {
    console.log('No ENG-202512- students found to convert.')
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${engStudents.length} ENG students to convert.`)

  let converted = 0
  let skipped = 0

  for (const s of engStudents) {
    maxNum += 1
    const newId = sciPrefix + String(maxNum).padStart(3, '0')

    // Safety check
    const collision = await prisma.student.findUnique({ where: { studentId: newId } })
    if (collision) {
      console.warn(`SKIP: target ${newId} already exists — skipping ${s.studentId}`)
      skipped++
      continue
    }

    await prisma.student.update({ where: { id: s.id }, data: { studentId: newId } })
    console.log(`UPDATED: ${s.studentId} -> ${newId}`)
    converted++
  }

  console.log(`\nDone. Converted: ${converted}, Skipped: ${skipped}`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
