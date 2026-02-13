import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const font = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HR SaaS',
  description: 'Multi-tenant HR SaaS',
}

const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = stored || (prefersDark ? 'dark' : 'light');
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (e) {}
  })();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--brand-surface-rgb))',
              color: 'rgb(var(--brand-text-rgb))',
              border: '1px solid rgb(var(--brand-text-rgb) / 0.14)',
            },
          }}
        />
      </body>
    </html>
  )
}

