/**
 * Authentication and Authorization Utilities
 * Provides role-based access control helpers
 */

import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

/**
 * Verify that the current user is authenticated and has ADMIN role
 * Used in server components and API routes
 */
export async function verifyAdminRole() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  return user?.role === 'ADMIN' ? user : null
}

/**
 * Require admin role - redirects to home if not authorized
 * Use in server components
 */
export async function requireAdminRole() {
  const admin = await verifyAdminRole()
  
  if (!admin) {
    redirect('/')
  }
  
  return admin
}

/**
 * Verify admin role for API routes
 * Returns { isAdmin: boolean, user: User | null, userId: string | null }
 */
export async function verifyAdminApiRole() {
  const { userId } = await auth()
  
  if (!userId) {
    return {
      isAdmin: false,
      user: null,
      userId: null
    }
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  return {
    isAdmin: user?.role === 'ADMIN',
    user,
    userId
  }
}

/**
 * Verify that the current user is authenticated and has TEACHER role
 */
export async function verifyTeacherRole() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  return user?.role === 'TEACHER' ? user : null
}

/**
 * Require teacher role - redirects to home if not authorized
 */
export async function requireTeacherRole() {
  const teacher = await verifyTeacherRole()
  
  if (!teacher) {
    redirect('/')
  }
  
  return teacher
}
