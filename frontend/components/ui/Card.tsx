import clsx from 'clsx'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={clsx('rounded-2xl border border-brand-text/10 bg-brand-surface p-6 shadow-card', className)}>
      {children}
    </section>
  )
}

