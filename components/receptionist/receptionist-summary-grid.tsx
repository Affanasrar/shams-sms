import type { ReactNode } from 'react'

export type ReceptionistSummaryItem = {
  label: string
  value: string | number
  icon: ReactNode
  suffix?: string
}

interface ReceptionistSummaryGridProps {
  items: ReceptionistSummaryItem[]
}

export function ReceptionistSummaryGrid({ items }: ReceptionistSummaryGridProps) {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <SummaryCard key={item.label} {...item} />
      ))}
    </div>
  )
}

function SummaryCard({ label, value, icon, suffix }: ReceptionistSummaryItem) {
  return (
    <div className="flex h-full min-h-32 flex-col justify-between rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{label}</p>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold leading-none text-white md:text-3xl">
        {value}
        {suffix && <span className="ml-2 text-sm font-medium text-white/60">{suffix}</span>}
      </p>
    </div>
  )
}