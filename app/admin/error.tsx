'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Admin Page Error
          </h2>
          <p className="text-red-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="space-y-2 text-sm text-red-500">
            <p>Possible causes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Missing environment variables</li>
              <li>Database connection issues</li>
              <li>Database not seeded</li>
            </ul>
          </div>
          <div className="mt-6 space-x-3">
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <a
              href="/api/health-check"
              target="_blank"
              className="inline-block px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Check Health
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
