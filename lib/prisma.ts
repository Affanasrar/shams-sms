// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL
  if (
    connectionString &&
    connectionString.includes('sslmode=require') &&
    !connectionString.includes('uselibpqcompat=true')
  ) {
    const separator = connectionString.includes('?') ? '&' : '?'
    connectionString += `${separator}uselibpqcompat=true`
  }

  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma