// components/ui/data-table.tsx
'use client'

import React, { useState } from 'react'
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  defaultPageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  defaultPageSize = 25,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
  })

  const totalFilteredRows = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()

  const startRowIndex = totalFilteredRows > 0 ? pageIndex * pageSize + 1 : 0
  const endRowIndex = Math.min((pageIndex + 1) * pageSize, totalFilteredRows)

  return (
    <div className="space-y-4">
      {searchKey && (
        <Input
          placeholder={searchPlaceholder || `Search ${searchKey}…`}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm rounded-xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-5 py-3 text-slate-700 dark:text-slate-300 font-semibold">
                    {header.isPlaceholder ? null : (
                      <div
                        className="flex items-center cursor-pointer select-none gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-200 dark:divide-slate-800">
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-3.5 text-slate-800 dark:text-slate-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 text-sm text-slate-600 dark:text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-900 dark:text-white">{startRowIndex}</span> to{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{endRowIndex}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{totalFilteredRows}</span> entries
        </div>

        <div className="flex items-center gap-2">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-xs">Show</span>
            <select
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-900 dark:text-white outline-none"
            >
              {[25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-xs">per page</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </Button>

            <span className="px-3 text-xs font-medium text-slate-900 dark:text-white">
              Page {pageIndex + 1} of {Math.max(1, pageCount)}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
