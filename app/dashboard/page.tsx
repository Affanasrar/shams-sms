// app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardGateway() {
  const { userId } = await auth();
  
  if (!userId) redirect('/sign-in');

  // 1. Check our database for this user's role
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  // If user is not in DB yet (Webhook delay), show a waiting screen
  if (!dbUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Setting up your account...</h1>
          <p>Please refresh in 5 seconds.</p>
        </div>
      </div>
    )
  }

  // 2. Redirect based on Role
  if (dbUser.role === 'ADMIN') {
    redirect('/admin')
  } else {
    redirect('/teacher')
  }
}