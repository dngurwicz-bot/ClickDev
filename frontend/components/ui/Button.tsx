'use client'

import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost'

export function Button({
  variant = 'primary',
  loading,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg',
        variant === 'primary' && 'bg-brand-primary text-brand-surface hover:bg-brand-secondary',
        variant === 'secondary' && 'bg-brand-accent/12 text-brand-text hover:bg-brand-accent/18',
        variant === 'ghost' && 'bg-transparent text-brand-text/80 hover:bg-brand-text/5 hover:text-brand-text',
        (disabled || loading) && 'cursor-not-allowed opacity-60',
        className
      )}
    />
  )
}

