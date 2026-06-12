import { useEffect } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
          }
        }
        colorScheme: 'light' | 'dark'
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy'): void
        }
        MainButton: {
          setText(text: string): void
          show(): void
          hide(): void
          onClick(cb: () => void): void
        }
        expand(): void
        close(): void
        ready(): void
      }
    }
  }
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
    }
  }, [])

  const user = tg?.initDataUnsafe?.user ?? {
    id: 123456789,
    first_name: 'Dev',
    username: 'devuser',
  }

  const initData = tg?.initData ?? ''
  const isDark = tg?.colorScheme === 'dark'

  const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    try { tg?.HapticFeedback?.impactOccurred(style) } catch {}
  }

  return { tg, user, initData, isDark, haptic }
}
