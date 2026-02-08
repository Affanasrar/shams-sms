"use client"

import { useCallback, useEffect, useState, Fragment } from "react"
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
import { Users, DollarSign, Calendar, Settings, BookOpen } from "lucide-react"

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
          label: "Schedule",
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
    <>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search students, courses, fees... (⌘K)"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commands.map((group) => (
            <Fragment key={group.group}>
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
            </Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
