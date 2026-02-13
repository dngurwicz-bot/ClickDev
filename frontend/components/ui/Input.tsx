'use client'

import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

export function Input({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs font-medium text-brand-text/70">{label}</div> : null}
      <input
        {...props}
        className={clsx(
          'w-full rounded-xl border border-brand-text/15 bg-brand-surface px-3 py-2 text-sm',
          'placeholder:text-brand-text/40',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg',
          className
        )}
      />
    </label>
  )
}

