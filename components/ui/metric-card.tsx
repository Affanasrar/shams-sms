import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
  trend?: string
  subtitle?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-indigo-600 dark:text-indigo-400",
  valueColor = "text-slate-900 dark:text-white",
  trend,
  subtitle
}: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:border-indigo-500/40">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <p className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 shadow-inner transition-transform duration-300 group-hover:scale-110 dark:border-slate-800 dark:bg-slate-800/60">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}