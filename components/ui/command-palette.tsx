"use client"

import React, { useCallback, useEffect, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { Search, Users, DollarSign, Calendar, Settings, BookOpen } from "lucide-react"

interface CommandPaletteContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommandPaletteContext = React.createContext<CommandPaletteContextType | undefined>(undefined)

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext)
  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return context
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const commands = [
    {
      group: "Navigation",
      items: [
        {
          icon: <Users className="w-4 h-4" />,
          label: "Students",
          value: "students",
          onSelect: () => {
            router.push("/admin/students")
            setOpen(false)
          },
        },
        {
          icon: <DollarSign className="w-4 h-4" />,
          label: "Fees Dashboard",
          value: "fees",
          onSelect: () => {
            router.push("/admin/fees/dashboard")
            setOpen(false)
          },
        },
        {
          icon: <Calendar className="w-4 h-4" />,
          label: "Timetable",
          value: "schedule",
          onSelect: () => {
            router.push("/admin/schedule")
            setOpen(false)
          },
        },
        {
          icon: <BookOpen className="w-4 h-4" />,
          label: "Enrollment",
          value: "enrollment",
          onSelect: () => {
            router.push("/admin/enrollment")
            setOpen(false)
          },
        },
        {
          icon: <Settings className="w-4 h-4" />,
          label: "Settings",
          value: "settings",
          onSelect: () => {
            router.push("/admin/settings")
            setOpen(false)
          },
        },
      ],
    },
  ]

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search students, courses, fees... (⌘K)"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commands.map((group) => (
            <React.Fragment key={group.group}>
              <CommandGroup heading={group.group}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={item.onSelect}
                    className="cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  )
}
