"use client"

import React from "react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { EnrollmentRowActions } from "@/app/admin/enrollment/enrollment-row-actions"

export interface EnrollmentRow {
  id: string
  studentId: string
  studentName: string
  fatherName: string
  courseName: string
  slotDays: string
  slotStartTime: Date
  slotRoom: string
  joiningDate: Date
  status: string
  // data needed for actions
  currentSlotId: string
  currentCourseOnSlotId: string
  currentTiming: {
    days: string
    startTime: Date
    endTime: Date
    room: string
  }
  availableSlotsForCourse: Array<{
    id: string
    days: string
    startTime: Date
    endTime: Date
    room: { name: string; capacity: number }
    enrollmentCount: number
  }>
}

interface EnrollmentTableProps {
  data: EnrollmentRow[]
}

export function EnrollmentTable({ data }: EnrollmentTableProps) {
  const columns: ColumnDef<EnrollmentRow, any>[] = [
    {
      accessorKey: "studentId",
      header: "Student ID",
      cell: info => <span className="font-mono text-xs text-blue-600 font-medium">{info.getValue()}</span>,
    },
    {
      accessorKey: "studentName",
      header: "Student",
      cell: info => (
        <div>
          {info.getValue()}
          <div className="text-xs text-gray-500 font-normal">{info.row.original.fatherName}</div>
        </div>
      ),
    },
    {
      accessorKey: "courseName",
      header: "Course",
      cell: info => (
        <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded text-xs font-bold border border-blue-200">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: "slotDays",
      header: "Slot / Room",
      cell: info => (
        <div className="text-gray-600">
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="flex items-center gap-1 text-xs">
            {new Date(info.row.original.slotStartTime).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Karachi",
            })}
            <span>•</span>
            <span className="text-gray-500">{info.row.original.slotRoom}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "joiningDate",
      header: "Enrollment Date",
      cell: info =>
        new Date(info.getValue() as Date).toLocaleDateString("en-US", {
          timeZone: "Asia/Karachi",
        }),
    },
    {
      accessorKey: "id",
      header: "Action",
      cell: info => (
        <EnrollmentRowActions
          enrollmentId={info.getValue()}
          studentId={info.row.original.studentId}
          studentName={info.row.original.studentName}
          courseName={info.row.original.courseName}
          status={info.row.original.status}
          currentSlotId={info.row.original.currentSlotId}
          currentCourseOnSlotId={info.row.original.currentCourseOnSlotId}
          currentTiming={info.row.original.currentTiming}
          availableSlotsForCourse={info.row.original.availableSlotsForCourse}
        />
      ),
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
