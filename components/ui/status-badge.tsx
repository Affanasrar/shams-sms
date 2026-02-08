import React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "PAID" | "PENDING" | "OVERDUE" | "UNPAID" | "ACTIVE" | "INACTIVE" | "PROCESSING"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    PAID: {
      label: "Paid",
      className: "badge-success",
    },
    PENDING: {
      label: "Pending",
      className: "badge-warning",
    },
    OVERDUE: {
      label: "Overdue",
      className: "badge-error",
    },
    UNPAID: {
      label: "Unpaid",
      className: "badge-error",
    },
    ACTIVE: {
      label: "Active",
      className: "badge-success",
    },
    INACTIVE: {
      label: "Inactive",
      className: "badge-warning",
    },
    PROCESSING: {
      label: "Processing",
      className: "badge-info",
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
