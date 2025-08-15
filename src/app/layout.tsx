import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import EmotionProvider from '@/providers/EmotionProvider'
import ThemeProvider from '@/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Drone Flight Simulator',
  description: 'Next.js TS MUI7+Tailwind based drone flight simulator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='ja' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <EmotionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </EmotionProvider>
      </body>
    </html>
  )
}
