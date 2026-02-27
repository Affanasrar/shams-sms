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
import { Users, DollarSign, Calendar, Settings, BookOpen, Loader2 } from "lucide-react"

interface Student {
  id: string
  studentId: string
  name: string
}

interface Course {
  id: string
  name: string
}

interface Fee {
  id: string
  studentId: string
  amount: string
  status: string
  student?: { name: string; studentId: string }
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
        // Clear search when dialog opens
        if (!open) {
          setSearchQuery("")
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setStudents([])
      setCourses([])
      setFees([])
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const [studentsRes, coursesRes, feesRes] = await Promise.all([
          fetch(`/api/admin/search-students?q=${encodeURIComponent(searchQuery)}`),
          fetch(`/api/admin/search-courses?q=${encodeURIComponent(searchQuery)}`),
          fetch(`/api/admin/search-fees?q=${encodeURIComponent(searchQuery)}`),
        ])

        const studentsData = await studentsRes.json()
        const coursesData = await coursesRes.json()
        const feesData = await feesRes.json()

        setStudents(Array.isArray(studentsData) ? studentsData : [])
        setCourses(Array.isArray(coursesData) ? coursesData : [])
        setFees(Array.isArray(feesData) ? feesData : [])
        setIsLoading(false)
      } catch (error) {
        console.error("Search error:", error)
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  const navigationCommands = [
    {
      icon: <Users className="w-4 h-4" />,
      label: "All Students",
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
  ]

  const hasSearchResults = students.length > 0 || courses.length > 0 || fees.length > 0

  return (
    <>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search students, courses, fees... (⌘K)"
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isLoading && searchQuery.trim().length > 0 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Searching...</span>
            </div>
          )}

          {!isLoading && !hasSearchResults && searchQuery.trim().length === 0 && (
            <>
              <CommandGroup heading="Navigation">
                {navigationCommands.map((item) => (
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
            </>
          )}

          {!isLoading && hasSearchResults && searchQuery.trim().length > 0 && (
            <>
              {students.length > 0 && (
                <>
                  <CommandGroup heading="Students">
                    {students.map((student) => (
                      <CommandItem
                        key={student.id}
                        value={student.name}
                        onSelect={() => {
                          router.push(`/admin/students/${student.studentId}`)
                          setOpen(false)
                        }}
                        className="cursor-pointer"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          <span className="text-xs text-gray-500">{student.studentId}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {courses.length > 0 && (
                <>
                  <CommandGroup heading="Courses">
                    {courses.map((course) => (
                      <CommandItem
                        key={course.id}
                        value={course.name}
                        onSelect={() => {
                          router.push(`/admin/schedule?course=${course.id}`)
                          setOpen(false)
                        }}
                        className="cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>{course.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {fees.length > 0 && (
                <>
                  <CommandGroup heading="Fees">
                    {fees.map((fee) => (
                      <CommandItem
                        key={fee.id}
                        value={fee.student?.name || "Unknown"}
                        onSelect={() => {
                          router.push(`/admin/fees?student=${fee.studentId}`)
                          setOpen(false)
                        }}
                        className="cursor-pointer"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        <div className="flex flex-col">
                          <span>{fee.student?.name || "Unknown"}</span>
                          <span className="text-xs text-gray-500">
                            PKR {fee.amount} - {fee.status}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {!isLoading && !hasSearchResults && searchQuery.trim().length > 0 && (
            <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
