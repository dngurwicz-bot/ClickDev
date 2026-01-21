import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { OrganizationProvider } from '@/lib/contexts/OrganizationContext'

export const metadata: Metadata = {
  title: 'Click',
  description: 'מערכת ניהול משאבי אנוש Multi-Tenant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <OrganizationProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#2C3E50',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#27AE60',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#E74C3C',
                  secondary: '#fff',
                },
              },
            }}
          />
        </OrganizationProvider>
      </body>
    </html>
  )
}
