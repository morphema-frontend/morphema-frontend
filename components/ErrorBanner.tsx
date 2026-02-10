'use client'

import React from 'react'

export function ErrorBanner({ title, details }: { title: string; details?: any }) {
  return (
    <div className="card border-red-200 bg-red-50">
      <div className="font-semibold text-red-900">{title}</div>
      {details ? (
        <pre className="mt-2 overflow-auto rounded-md bg-white p-2 text-xs text-red-900">{typeof details === 'string' ? details : JSON.stringify(details, null, 2)}</pre>
      ) : null}
    </div>
  )
}
