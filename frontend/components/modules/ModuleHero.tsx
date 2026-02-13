'use client'

import React from 'react'

interface ModuleHeroProps {
  title: string
  subtitle: string
  accent?: string
  children?: React.ReactNode
}

export function ModuleHero({ title, subtitle, accent = '#1f7aa8', children }: ModuleHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/60 bg-white p-6 shadow-[0_16px_40px_rgba(31,63,86,0.12)]"
      dir="rtl"
      style={{ backgroundImage: `linear-gradient(135deg, ${accent}16, #ffffff 55%)` }}
    >
      <div className="relative z-10">
        <h1 className="text-3xl font-black tracking-tight text-[#1f3f56]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#5d7a8e]">{subtitle}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
      <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/35 blur-xl" />
      <div className="absolute bottom-0 right-0 h-20 w-20 rounded-full bg-white/40 blur-lg" />
    </section>
  )
}
