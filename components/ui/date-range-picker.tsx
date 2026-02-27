// components/ui/date-range-picker.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, subDays, parseISO } from 'date-fns'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon } from 'lucide-react'

export function DateRangePicker() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')

  const defaultFrom = startParam ? parseISO(startParam) : subDays(new Date(), 30)
  const defaultTo = endParam ? parseISO(endParam) : new Date()

  const [range, setRange] = useState<{ from: Date; to: Date }>({ from: defaultFrom, to: defaultTo })

  useEffect(() => {
    if (startParam || endParam) {
      setRange({
        from: startParam ? parseISO(startParam) : subDays(new Date(), 30),
        to: endParam ? parseISO(endParam) : new Date(),
      })
    }
  }, [startParam, endParam])

  function updateUrl(from?: Date, to?: Date) {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (from) params.set('start', format(from, 'yyyy-MM-dd'))
    else params.delete('start')

    if (to) params.set('end', format(to, 'yyyy-MM-dd'))
    else params.delete('end')

    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startParam || endParam
            ? `${format(range.from, 'MMM dd, yyyy')} – ${format(range.to, 'MMM dd, yyyy')}`
            : 'All dates'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex flex-col space-y-2">
          <label className="flex flex-col text-sm">
            From
            <input
              type="date"
              value={format(range.from, 'yyyy-MM-dd')}
              onChange={(e) => {
                const d = new Date(e.target.value)
                setRange((prev) => ({ ...prev, from: d }))
                updateUrl(d, range.to)
              }}
              className="border rounded p-1"
            />
          </label>
          <label className="flex flex-col text-sm">
            To
            <input
              type="date"
              value={format(range.to, 'yyyy-MM-dd')}
              onChange={(e) => {
                const d = new Date(e.target.value)
                setRange((prev) => ({ ...prev, to: d }))
                updateUrl(range.from, d)
              }}
              className="border rounded p-1"
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}
