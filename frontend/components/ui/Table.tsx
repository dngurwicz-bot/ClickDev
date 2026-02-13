import clsx from 'clsx'

export function Table({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={clsx('overflow-hidden rounded-2xl border border-brand-text/10 bg-brand-surface', className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={clsx(
        'border-b border-brand-text/10 bg-brand-bg/60 px-4 py-3 text-xs font-semibold text-brand-text/70',
        className
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={clsx('border-b border-brand-text/10 px-4 py-3 align-middle', className)}>{children}</td>
}
