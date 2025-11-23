import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/ToastContainer'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RollScape - D&D Virtual Tabletop',
  description: 'AI-powered Dungeons & Dragons virtual tabletop with multiplayer support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
