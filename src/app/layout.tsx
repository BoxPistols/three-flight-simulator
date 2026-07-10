import type { Metadata } from 'next'
import { Noto_Sans_JP, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import EmotionProvider from '@/providers/EmotionProvider'
import ThemeProvider from '@/providers/ThemeProvider'

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ドローン フライトプランナー',
  description:
    'ドローンの自動飛行ルートを3D空間で計画し、飛行前にプレビュー・検証できるWebツール',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='ja' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${notoSansJp.variable} ${jetbrainsMono.variable}`}
      >
        <EmotionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </EmotionProvider>
      </body>
    </html>
  )
}
