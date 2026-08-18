'use client'

export function SkeletonCard() {
 return (
 <div className="bg-card rounded-lg border p-4 md:p-6 animate-pulse">
 <div className="space-y-4">
 <div className="h-6 bg-muted rounded w-3/4"></div>
 <div className="space-y-2">
 <div className="h-4 bg-muted rounded w-full"></div>
 <div className="h-4 bg-muted rounded w-5/6"></div>
 </div>
 </div>
 </div>
 )
}

export function SkeletonStat() {
 return (
 <div className="bg-card rounded-lg border p-4 md:p-6 animate-pulse">
 <div className="space-y-3">
 <div className="h-4 bg-muted rounded w-2/3"></div>
 <div className="h-8 bg-muted rounded w-1/2"></div>
 </div>
 </div>
 )
}

export function SkeletonHeader() {
 return (
 <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 md:p-8 rounded-2xl animate-pulse">
 <div className="space-y-3">
 <div className="h-8 bg-blue-600 rounded w-2/3"></div>
 <div className="h-4 bg-blue-600 rounded w-full"></div>
 </div>
 </div>
 )
}

export function SkeletonList() {
 return (
 <div className="space-y-2">
 {[1, 2, 3].map((i) => (
 <div key={i} className="bg-card rounded-lg border p-4 md:p-6 animate-pulse">
 <div className="space-y-3">
 <div className="h-5 bg-muted rounded w-3/4"></div>
 <div className="h-4 bg-muted rounded w-1/2"></div>
 </div>
 </div>
 ))}
 </div>
 )
}
