import EmotionProvider from '@/providers/EmotionProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='ja'>
      <body>
        <EmotionProvider>{children}</EmotionProvider>
      </body>
    </html>
  )
}
