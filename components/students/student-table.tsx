"use client"

import React from "react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

export interface StudentRow {
  id: string
  studentId: string
  name: string
  fatherName: string
  phone: string | null
  admission: Date
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
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search name or ID…"
    />
  )
}
