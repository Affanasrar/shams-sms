'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { extendCourse } from '@/app/actions/enrollment'
import { X, Calendar } from 'lucide-react'

interface ExtendCourseModalProps {
  enrollmentId: string
  courseName: string
  isOpen: boolean
  onClose: () => void
}

export function ExtendCourseModal({ enrollmentId, courseName, isOpen, onClose }: ExtendCourseModalProps) {
  const [state, formAction, isPending] = useActionState(extendCourse, null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={20} />
            Extend Course
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Extend course duration for: <strong>{courseName}</strong>
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="enrollmentId" value={enrollmentId} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Days
            </label>
            <input
              type="number"
              name="additionalDays"
              min="1"
              max="365"
              required
              placeholder="e.g. 30"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the number of additional days to extend the course
            </p>
          </div>

          {state?.error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
              {state.message}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Extending...' : 'Extend Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}