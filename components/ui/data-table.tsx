import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData> {
  columns: Array<{
    key: string
    label: string
    render?: (data: any) => React.ReactNode
    sortable?: boolean
    width?: string
  }>
  data: TData[]
  isLoading?: boolean
  rowClassName?: string
  onRowClick?: (row: TData) => void
}

export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  isLoading,
  rowClassName,
  onRowClick,
}: DataTableProps<TData>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("font-semibold", column.width)}
              >
                {column.label}
                {column.sortable && <span className="ml-1 text-muted-foreground">↕</span>}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                No data found
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "data-table-text transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50",
                  rowClassName
                )}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.width}>
                    {column.render
                      ? column.render(row[column.key])
                      : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
