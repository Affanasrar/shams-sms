'use client'

import React from 'react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { DroppedStudentRowActions } from './dropped-student-row-actions'
import { format, formatDistance } from 'date-fns'

export interface DroppedStudentRow {
  id: string
  enrollmentId: string
  studentId: string
  studentName: string
  fatherName: string
  courseName: string
  slotDays: string
  slotStartTime: Date
  slotRoom: string
  joiningDate: Date
  droppedDate: Date
  endDate: Date
  extendedDays: number
  daysDropped: number
  phone?: string
  dropReason: 'duration' | 'admin'
  courseDurationMonths?: number
}

interface DroppedStudentTableProps {
  data: DroppedStudentRow[]
}

export function DroppedStudentTable({ data }: DroppedStudentTableProps) {
  const columns: ColumnDef<DroppedStudentRow, any>[] = [
    {
      accessorKey: 'studentId',
      header: 'Student ID',
      cell: (info) => (
        <span className="font-mono text-xs text-blue-600 font-medium">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="text-xs text-gray-500">
            Father: {info.row.original.fatherName}
          </div>
          {info.row.original.phone && (
            <div className="text-xs text-gray-500">{info.row.original.phone}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'courseName',
      header: 'Course',
      cell: (info) => (
        <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded text-xs font-bold border border-purple-200">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'droppedDate',
      header: 'Dropped Date',
      cell: (info) => {
        const date = new Date(info.getValue() as Date)
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {format(date, 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-gray-500">
              {formatDistance(date, new Date(), { addSuffix: true })}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'daysDropped',
      header: 'Days Ago',
      cell: (info) => (
        <span className="font-medium text-orange-600">
          {info.getValue()} days
        </span>
      ),
    },
    {
      accessorKey: 'dropReason',
      header: 'Drop Reason',
      cell: (info) => {
        const reason = info.getValue()
        return (
          <div>
            {reason === 'duration' ? (
              <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded text-xs font-semibold border border-yellow-200">
                📅 Course Duration
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded text-xs font-semibold border border-red-200">
                🚫 Admin Dropped
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'slotDays',
      header: 'Last Slot / Room',
      cell: (info) => (
        <div className="text-gray-600">
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="flex items-center gap-1 text-xs">
            {new Date(info.row.original.slotStartTime).toLocaleTimeString(
              'en-US',
              {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Karachi',
              }
            )}
            <span>•</span>
            <span className="text-gray-500">{info.row.original.slotRoom}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Actions',
      cell: (info) => (
        <DroppedStudentRowActions
          enrollmentId={info.row.original.enrollmentId}
          studentId={info.row.original.studentId}
          studentName={info.row.original.studentName}
          courseName={info.row.original.courseName}
          droppedDate={info.row.original.droppedDate}
          dropReason={info.row.original.dropReason}
        />
      ),
    },
  ]

  return <DataTable columns={columns} data={data} />
}
