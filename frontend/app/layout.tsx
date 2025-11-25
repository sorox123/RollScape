import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/ToastContainer'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineIndicator } from '@/components/OfflineIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RollScape - D&D Virtual Tabletop',
  description: 'AI-powered Dungeons & Dragons virtual tabletop with multiplayer support',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RollScape',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RollScape" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <OfflineIndicator />
        <ToastProvider>
          <ConfirmProvider>
            {children}
            <PWAInstallPrompt />
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
