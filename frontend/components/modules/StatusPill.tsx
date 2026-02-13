'use client'

export function StatusPill({ status }: { status: string }) {
  const normalized = status?.toLowerCase?.() || ''
  const style =
    normalized.includes('complete') || normalized.includes('signed') || normalized.includes('active')
      ? 'bg-[#e7f7ee] text-[#1f8a4d] border-[#bde7cb]'
      : normalized.includes('pending') || normalized.includes('draft')
        ? 'bg-[#fff6e8] text-[#a66708] border-[#f2d6a8]'
        : normalized.includes('failed') || normalized.includes('error')
          ? 'bg-[#ffeef0] text-[#b42334] border-[#f3b9bf]'
          : 'bg-[#edf4f9] text-[#2f607e] border-[#c8dbe7]'

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style}`}>{status || 'n/a'}</span>
}
