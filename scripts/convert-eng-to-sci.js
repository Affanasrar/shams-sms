const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const prefixFrom = 'ENG-202512-'
  const prefixTo = 'SCI-202512-'

  const students = await prisma.student.findMany({
    where: { studentId: { startsWith: prefixFrom } },
    orderBy: { studentId: 'asc' }
  })

  if (!students.length) {
    console.log('No students found with prefix', prefixFrom)
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${students.length} students to convert.`)
  let converted = 0
  let skipped = 0

  for (const s of students) {
    const newId = s.studentId.replace(prefixFrom, prefixTo)

    const collision = await prisma.student.findUnique({ where: { studentId: newId } })
    if (collision) {
      console.warn(`SKIP: target studentId already exists for ${s.studentId} -> ${newId}`)
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
