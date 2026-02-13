export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={className}
      dir="ltr"
      style={{ fontFamily: 'var(--font-rubik), Rubik, ui-sans-serif, system-ui' }}
    >
      <div className="flex items-center gap-3">
        <div className="text-[28px] font-black tracking-tight text-brand-secondary">
          CLICK<span className="text-brand-primary">.</span>
        </div>
        <div className="h-5 w-px bg-brand-accent/60" />
        <div className="text-[12px] font-medium leading-[1.1] text-brand-accent">
          DNG
          <br />
          HUB
        </div>
      </div>
    </div>
  )
}
