const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const msgs = await prisma.smsMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      phoneNumber: true,
      message: true,
      status: true,
      sentAt: true,
      createdAt: true,
    }
  })

  console.log('\nRecent SMS Messages (most recent first):\n')
  msgs.forEach(m => {
    console.log('---')
    console.log(`id: ${m.id}`)
    console.log(`phone: ${m.phoneNumber}`)
    console.log(`status: ${m.status}`)
    console.log(`sentAt: ${m.sentAt}`)
    console.log(`createdAt: ${m.createdAt}`)
    console.log('message:')
    console.log(m.message)
    console.log('\n')
  })

  await prisma.$disconnect()
}

main().catch(e => {
  console.error('Error fetching SMS messages:', e)
  prisma.$disconnect().then(() => process.exit(1))
})
