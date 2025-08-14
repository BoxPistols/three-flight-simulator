'use client'

import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { ReactNode } from 'react'

interface EmotionProviderProps {
  children: ReactNode
}

export default function EmotionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const cache = createCache({ key: 'css', prepend: true })
  cache.compat = true

  return <CacheProvider value={cache}>{children}</CacheProvider>
}
3
