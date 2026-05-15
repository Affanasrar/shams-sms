const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Seeding SMS test data...\n')

    // Get 5 random students
    const students = await prisma.student.findMany({
      take: 5
    })

    if (students.length === 0) {
      console.log('❌ No students found with phone numbers')
      return
    }

    console.log(`📱 Found ${students.length} students with phone numbers\n`)

    // Create test SMS messages for each student
    const messages = [
      'Welcome to Shams Computer Institute! Your enrollment is confirmed.',
      'Reminder: Your course fee is due next week. Please collect your fee at your earliest convenience.',
      'Your attendance is below 75%. Please attend classes regularly.',
      'Course assignment submitted successfully. You scored 95/100!',
      'Hi! Is your course going well? Let us know if you need any help.'
    ]

    let created = 0
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      
      // Create outbound message
      const smsMessage = await prisma.smsMessage.create({
        data: {
          studentId: student.id,
          phoneNumber: student.phone,
          message: messages[i % messages.length],
          direction: 'OUTBOUND',
          status: 'DELIVERED',
          textbeeId: `test-${Date.now()}-${i}`,
          sentAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24) // Random time in last 24h
        }
      })

      console.log(`✅ Created SMS for ${student.name} (${student.studentId})`)
      created++
    }

    console.log(`\n✨ Created ${created} test SMS messages!`)
    console.log('🔄 Reload http://localhost:3000/admin/sms/inbox to see conversations')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
