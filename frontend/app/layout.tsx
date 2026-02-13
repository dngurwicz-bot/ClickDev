import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const font = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CLICK',
  description: 'CLICK - מערכת משאבי אנוש רב-ארגונית',
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
    <html lang="he" dir="rtl" className={font.variable}>
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
