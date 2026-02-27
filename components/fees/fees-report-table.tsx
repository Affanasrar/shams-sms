"use client"

import React from "react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

export interface FeeRow {
  id: string
  studentName: string
  finalAmount: number
  status: string
  dueDate: Date
}

interface FeesReportTableProps {
  data: FeeRow[]
}

export function FeesReportTable({ data }: FeesReportTableProps) {
  const columns: ColumnDef<FeeRow, any>[] = [
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'finalAmount',
      header: 'Amount',
      cell: info => `PKR ${info.getValue().toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: info =>
        new Date(info.getValue() as Date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="studentName"
      searchPlaceholder="Search student…"
    />
  )
}
