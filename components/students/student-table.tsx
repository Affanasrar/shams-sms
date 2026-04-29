"use client"

import React from "react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"

export interface StudentRow {
  id: string
  studentId: string
  name: string
  fatherName: string
  phone: string | null
  admission: Date
  smsReminderEnabled: boolean
}

interface StudentTableProps {
  data: StudentRow[]
}

export function StudentTable({ data }: StudentTableProps) {
  const columns: ColumnDef<StudentRow, any>[] = [
    {
      accessorKey: "studentId",
      header: "Student ID",
      cell: info => <span className="font-mono text-xs text-blue-600 font-medium">{info.getValue()}</span>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: info => {
        const id = info.row.original.studentId
        return (
          <Link
            href={`/admin/students/${id}`}
            className="hover:text-blue-600 hover:underline"
          >
            {info.getValue()}
          </Link>
        )
      },
    },
    {
      accessorKey: "fatherName",
      header: "Father's Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "admission",
      header: "Joined",
      cell: info =>
        new Date(info.getValue() as Date).toLocaleDateString("en-US", {
          timeZone: "Asia/Karachi",
        }),
    },
    {
      accessorKey: "smsReminderEnabled",
      header: "SMS Reminders",
      cell: info => {
        const enabled = info.getValue() as boolean
        const studentId = info.row.original.id
        return (
          <Switch
            checked={enabled}
            onCheckedChange={async (checked) => {
              try {
                const response = await fetch(`/api/admin/students/${studentId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ smsReminderEnabled: checked })
                })
                if (!response.ok) {
                  throw new Error('Failed to update')
                }
                // Optionally, refresh the page or update state
                window.location.reload()
              } catch (error) {
                console.error('Error updating SMS reminder setting:', error)
                alert('Failed to update SMS reminder setting')
              }
            }}
          />
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
    />
  )
}
