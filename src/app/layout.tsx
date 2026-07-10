import type { Metadata } from 'next'
import './globals.css'
import EmotionProvider from '@/providers/EmotionProvider'
import ThemeProvider from '@/providers/ThemeProvider'

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
      <body suppressHydrationWarning>
        <EmotionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </EmotionProvider>
      </body>
    </html>
  )
}
