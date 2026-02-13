'use client'

import { useEffect } from 'react'
import clsx from 'clsx'

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-brand-text/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative w-full max-w-lg rounded-2xl border border-brand-text/12 bg-brand-surface p-6 shadow-card'
        )}
      >
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

