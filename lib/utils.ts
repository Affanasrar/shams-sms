import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "PKR"): string {
  return new Intl.NumberFormat("ur-PK", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ur-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

// Generate unique student ID in format: SCI-YYMM-XXX
export async function generateStudentId(prisma: any): Promise<string> {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2) // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0') // Month with leading zero
  
  const prefix = `SCI-${year}${month}`
  
  // Find the highest sequential number for this month
  const lastStudent = await prisma.student.findFirst({
    where: {
      studentId: {
        startsWith: prefix
      }
    },
    orderBy: {
      studentId: 'desc'
    }
  })
  
  let nextNumber = 1
  if (lastStudent) {
    // Extract the sequential number from the last student ID
    const lastNumber = parseInt(lastStudent.studentId.split('-')[2])
    nextNumber = lastNumber + 1
  }
  
  // Format as 3-digit number with leading zeros
  const sequential = nextNumber.toString().padStart(3, '0')
  
  return `${prefix}-${sequential}`
}
