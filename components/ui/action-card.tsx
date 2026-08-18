import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface ActionCardProps {
 title: string
 description: string
 icon: LucideIcon
 href: string
 colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red'
}

const colorSchemes = {
 blue: {
 bg: 'bg-blue-50 dark:bg-blue-950/40',
 border: 'border-blue-200 dark:border-blue-900/50',
 hover: 'hover:bg-blue-100',
 icon: 'bg-blue-50 dark:bg-blue-950/400',
 iconHover: 'group-hover:bg-blue-600'
 },
 green: {
 bg: 'bg-green-50 dark:bg-green-950/40',
 border: 'border-green-200 dark:border-green-900/50',
 hover: 'hover:bg-green-100',
 icon: 'bg-green-50 dark:bg-green-950/400',
 iconHover: 'group-hover:bg-green-600'
 },
 purple: {
 bg: 'bg-purple-50 dark:bg-purple-950/40',
 border: 'border-purple-200 dark:border-purple-900/50',
 hover: 'hover:bg-purple-100',
 icon: 'bg-purple-50 dark:bg-purple-950/400',
 iconHover: 'group-hover:bg-purple-600'
 },
 orange: {
 bg: 'bg-orange-50 dark:bg-orange-950/40',
 border: 'border-orange-200 dark:border-orange-900/50',
 hover: 'hover:bg-orange-100',
 icon: 'bg-orange-50 dark:bg-orange-950/400',
 iconHover: 'group-hover:bg-orange-600'
 },
 indigo: {
 bg: 'bg-indigo-50 dark:bg-indigo-950/40',
 border: 'border-indigo-200 dark:border-indigo-900/50',
 hover: 'hover:bg-indigo-100',
 icon: 'bg-indigo-50 dark:bg-indigo-950/400',
 iconHover: 'group-hover:bg-indigo-600'
 },
 red: {
 bg: 'bg-red-50 dark:bg-red-950/40',
 border: 'border-red-200 dark:border-red-900/50',
 hover: 'hover:bg-red-100',
 icon: 'bg-red-50 dark:bg-red-950/400',
 iconHover: 'group-hover:bg-red-600'
 }
}

export function ActionCard({ title, description, icon: Icon, href, colorScheme = 'blue' }: ActionCardProps) {
 const colors = colorSchemes[colorScheme]

 return (
 <Link
 href={href}
 className={`flex items-center gap-4 p-6 ${colors.bg} border ${colors.border} rounded-lg ${colors.hover} transition-colors group`}
 >
 <div className={`p-3 ${colors.icon} text-white rounded-lg group-hover:${colors.iconHover} transition-colors`}>
 <Icon size={24} />
 </div>
 <div>
 <h4 className="font-semibold text-foreground">{title}</h4>
 <p className="text-sm text-muted-foreground">{description}</p>
 </div>
 </Link>
 )
}