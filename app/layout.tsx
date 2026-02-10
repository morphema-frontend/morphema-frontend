import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import DemoBanner from './DemoBanner'

export const metadata: Metadata = {
  title: 'Morphema',
  description: 'Demo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <DemoBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
