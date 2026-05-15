const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📊 Checking database...\n')

    // Count students
    const totalStudents = await prisma.student.count()
    console.log(`Total students: ${totalStudents}`)

    // Count SMS messages
    const totalMessages = await prisma.smsMessage.count()
    console.log(`Total SMS messages: ${totalMessages}`)

    // Get students with SMS messages
    const studentsWithMessages = await prisma.student.findMany({
      where: {
        smsMessages: { some: {} }
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        phone: true,
        smsMessages: {
          select: {
            id: true,
            message: true,
            createdAt: true
          }
        }
      }
    })

    console.log(`\nStudents with SMS messages: ${studentsWithMessages.length}`)
    studentsWithMessages.forEach(student => {
      console.log(`\n  ${student.name} (${student.studentId}):`)
      console.log(`    Phone: ${student.phone}`)
      console.log(`    Messages: ${student.smsMessages.length}`)
    })

    // Get all SMS messages
    const allMessages = await prisma.smsMessage.findMany({
      select: {
        id: true,
        studentId: true,
        phoneNumber: true,
        message: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`\n\nLatest 10 SMS messages:`)
    allMessages.forEach((msg, idx) => {
      console.log(`${idx + 1}. [${msg.status}] ${msg.phoneNumber}: "${msg.message.substring(0, 50)}..."`)
    })

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
