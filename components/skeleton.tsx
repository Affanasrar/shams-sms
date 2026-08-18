import React from 'react'

export function BlockSkeleton({ className = '' }: { className?: string }) {
 return <div className={`animate-pulse bg-muted rounded ${className}`} />
}

export default BlockSkeleton
