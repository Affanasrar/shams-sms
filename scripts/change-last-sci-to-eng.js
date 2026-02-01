const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const prefix = 'SCI-202512-'
  const targetPrefix = 'ENG-202512-'

  const students = await prisma.student.findMany({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: 'desc' }
  })

  if (!students.length) {
    console.log('No students found with prefix', prefix)
    await prisma.$disconnect()
    return
  }

  const last = students[0]
  const newId = last.studentId.replace(prefix, targetPrefix)

  const exists = await prisma.student.findUnique({ where: { studentId: newId } })
  if (exists) {
    console.log(`Cannot rename ${last.studentId} -> ${newId}: target ID already exists.`)
    await prisma.$disconnect()
    return
  }

  await prisma.student.update({ where: { id: last.id }, data: { studentId: newId } })
  console.log(`Renamed ${last.studentId} -> ${newId}`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
