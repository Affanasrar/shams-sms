"use client"

import dynamic from "next/dynamic"
import React from "react"

// This component lives entirely on the client.  It dynamically loads
// the real ClientProviders with `ssr: false` to ensure that none of the
// Radix/dialog markup is generated during server rendering.  The layout
// can safely import and render this component from a server component.

const ClientProvidersInner = dynamic(
  () => import("./client-providers").then((m) => m.ClientProviders),
  { ssr: false }
)

interface Props {
  children: React.ReactNode
}

export default function DynamicClientProviders({ children }: Props) {
  return <ClientProvidersInner>{children}</ClientProvidersInner>
}
