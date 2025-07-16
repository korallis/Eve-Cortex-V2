import { Providers } from '@/components/providers'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Eve-Cortex | AI-Powered EVE Online Optimization',
    template: '%s | Eve-Cortex',
  },
  description:
    'Optimize your EVE Online experience with AI-powered intelligence. Strategic advantage through data-driven insights.',
  keywords: [
    'EVE Online',
    'optimization',
    'AI',
    'ship fitting',
    'skill planning',
    'market analysis',
  ],
  authors: [{ name: 'Eve-Cortex Team' }],
  creator: 'Eve-Cortex',
  publisher: 'Eve-Cortex',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env['APP_URL'] || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Eve-Cortex | AI-Powered EVE Online Optimization',
    description:
      'Optimize your EVE Online experience with AI-powered intelligence. Strategic advantage through data-driven insights.',
    siteName: 'Eve-Cortex',
    images: [
      {
        url: '/brand/social/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Eve-Cortex - AI-Powered EVE Online Optimization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eve-Cortex | AI-Powered EVE Online Optimization',
    description: 'Optimize your EVE Online experience with AI-powered intelligence.',
    images: ['/brand/social/twitter-card.png'],
    creator: '@evecortex',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-dark-primary text-white antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1A1A1C',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
