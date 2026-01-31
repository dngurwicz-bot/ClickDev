import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { Rubik } from 'next/font/google'
import './globals.css'
import { OrganizationProvider } from '@/lib/contexts/OrganizationContext'
import { SidebarProvider } from '@/lib/contexts/SidebarContext'
import { InactivityProvider } from '@/lib/contexts/InactivityContext'

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-rubik',
  display: 'swap',
})

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
    <html lang="he" dir="rtl" className={rubik.variable} suppressHydrationWarning>
      <head />
      <body>
        <OrganizationProvider>
          <SidebarProvider>
            <InactivityProvider>
              {children}
            </InactivityProvider>
          </SidebarProvider>
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
