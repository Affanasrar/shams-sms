'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
 const [theme, setTheme] = useState<'light' | 'dark'>('light')

 useEffect(() => {
 const isDark = document.documentElement.classList.contains('dark') ||
 (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
 localStorage.theme === 'dark'

 if (isDark) {
 document.documentElement.classList.add('dark')
 setTheme('dark')
 } else {
 document.documentElement.classList.remove('dark')
 setTheme('light')
 }
 }, [])

 const toggleTheme = () => {
 if (theme === 'light') {
 document.documentElement.classList.add('dark')
 localStorage.setItem('theme', 'dark')
 setTheme('dark')
 } else {
 document.documentElement.classList.remove('dark')
 localStorage.setItem('theme', 'light')
 setTheme('light')
 }
 }

 return (
 <button
 onClick={toggleTheme}
 type="button"
 className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 p-2 text-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground ${className}`}
 aria-label="Toggle Theme"
 title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
 >
 {theme === 'dark' ? (
 <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0" />
 ) : (
 <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-300 transition-transform duration-300 rotate-0 dark:text-indigo-400" />
 )}
 </button>
 )
}
