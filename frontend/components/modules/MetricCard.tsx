'use client'

import React from 'react'

export function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <article className="rounded-xl border border-[#d8e6ef] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#67869a]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#1f3f56]">{value}</p>
      {note && <p className="mt-1 text-xs text-[#6f8ea2]">{note}</p>}
    </article>
  )
}
