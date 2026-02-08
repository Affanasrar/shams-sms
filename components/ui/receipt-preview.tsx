import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ReceiptPreviewProps {
  studentName: string
  studentId: string
  courseCode: string
  courseName: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  dueDate: string
  status: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE"
  transactionDate?: string
  paymentMethod?: string
}

export function ReceiptPreview({
  studentName,
  studentId,
  courseCode,
  courseName,
  totalAmount,
  paidAmount,
  dueAmount,
  dueDate,
  status,
  transactionDate,
  paymentMethod,
}: ReceiptPreviewProps) {
  return (
    <div className="space-y-4">
      <Card className="p-8 max-w-md bg-white">
        {/* Header */}
        <div className="border-b border-border pb-6 mb-6 text-center">
          <h1 className="text-2xl font-bold">SHAMS SMS</h1>
          <p className="text-sm text-muted-foreground">Fee Receipt</p>
          <p className="text-xs text-muted-foreground mt-2">
            Receipt Date: {formatDate(new Date())}
          </p>
        </div>

        {/* Student Information */}
        <div className="border-b border-border pb-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student Name:</span>
            <span className="font-medium">{studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student ID:</span>
            <span className="font-mono text-xs">{studentId}</span>
          </div>
        </div>

        {/* Course Information */}
        <div className="border-b border-border pb-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Course Code:</span>
            <span className="font-medium">{courseCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Course Name:</span>
            <span className="font-medium">{courseName}</span>
          </div>
        </div>

        {/* Fee Details */}
        <div className="border-b border-border pb-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Fee:</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Previously Paid:</span>
            <span className="text-emerald-600 font-medium">{formatCurrency(paidAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Amount:</span>
            <span className="text-red-600 font-medium">{formatCurrency(dueAmount)}</span>
          </div>
        </div>

        {/* Due Date & Status */}
        <div className="border-b border-border pb-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-medium">{formatDate(dueDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              variant={status === "PAID" ? "default" : status === "PARTIAL" ? "secondary" : "destructive"}
            >
              {status}
            </Badge>
          </div>
        </div>

        {/* Payment Details (if paid) */}
        {transactionDate && paymentMethod && (
          <div className="border-b border-border pb-4 mb-4 space-y-2 text-sm bg-muted/50 p-3 rounded">
            <p className="font-semibold text-center">Payment Information</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Date:</span>
              <span className="font-medium">{formatDate(transactionDate)}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            For inquiries, contact the admin office
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Thank you for your payment
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  )
}
