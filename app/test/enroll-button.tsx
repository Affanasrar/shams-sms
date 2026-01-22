// app/test/enroll-button.tsx
'use client'

import { useState } from 'react'
import { enrollStudent } from '@/app/actions/enrollment'
import { createDummyStudent, backdateEnrollment } from '@/app/actions/debug' 

export function EnrollButton({ courseOnSlotId }: { courseOnSlotId: string }) {
  const [message, setMessage] = useState('')
  const [lastStudentId, setLastStudentId] = useState<string | null>(null)

  // 1. Enroll
  const handleEnroll = async () => {
    setMessage('Creating Student...')
    try {
      const student = await createDummyStudent()
      await enrollStudent(student.id, courseOnSlotId)
      setLastStudentId(student.id)
      setMessage(`✅ Enrolled: ${student.name}. Now "Rewind Time" to test fees.`)
    } catch (e: any) {
      setMessage(`❌ ERROR: ${e.message}`)
    }
  }

  // 2. Backdate
  const handleRewind = async () => {
    if (!lastStudentId) return setMessage("Enroll a student first!")
    try {
      await backdateEnrollment(lastStudentId, 1) // Go back 1 month
      setMessage("⏳ Time Rewound! This student now thinks they joined 1 month ago.")
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    }
  }

  // 3. Trigger Cron
  const handleCron = async () => {
    setMessage("🤖 Running Fee Generation Robot...")
    try {
      // We call the API route we just made
      const res = await fetch('/api/cron/fees', {
        headers: { 
            // This matches the CRON_SECRET in your .env
            'Authorization': 'Bearer MakeSureThisIsLongAndSecure' 
        }
      })
      const data = await res.json()
      setMessage(`✅ Robot Finished: Generated ${data.generated} new fees.`)
      console.log(data.logs)
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 rounded text-sm font-mono h-24 overflow-y-auto border">
        {message || "System Ready..."}
      </div>

      <div className="flex gap-2">
        <button onClick={handleEnroll} className="bg-black text-white px-4 py-2 rounded">
          1. Enroll New Student
        </button>
        
        <button onClick={handleRewind} className="bg-blue-600 text-white px-4 py-2 rounded">
          2. Rewind 1 Month
        </button>

        <button onClick={handleCron} className="bg-green-600 text-white px-4 py-2 rounded">
          3. Run Fee Robot
        </button>
      </div>
    </div>
  )
}