import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LegalDisclaimer from '@/components/LegalDisclaimer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LegalSathi AI - Legal Information Platform',
  description: 'An AI-powered Legal Information and Guidance Platform.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e293b', // Adjusted for a more professional legal look
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
        <LegalDisclaimer />
        {children}
      </body>
    </html>
  )
}

