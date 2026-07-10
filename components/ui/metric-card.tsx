import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
}

export function MetricCard({ title, value, icon: Icon, iconColor = "text-blue-600", valueColor = "text-slate-900" }: MetricCardProps) {
  return (
    <div className="premium-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/5 p-3">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}