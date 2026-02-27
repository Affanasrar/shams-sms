"use client"

import React from "react"
import { CommandPaletteProvider } from "./command-palette"
import { ToastProvider } from "../providers/toast-provider"

interface Props {
  children: React.ReactNode
}

// This component is purely client-side.  Wrapping the radixin-based
// CommandPaletteProvider and the Toaster ensures no unstable markup is
// rendered on the server, which would otherwise trigger hydration
// mismatches when the layout is hydrated.
export function ClientProviders({ children }: Props) {
  return (
    <CommandPaletteProvider>
      <ToastProvider />
      {children}
    </CommandPaletteProvider>
  )
}
