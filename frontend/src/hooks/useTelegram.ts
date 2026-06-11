import { useEffect } from 'react'

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
          }
        }
        colorScheme: 'light' | 'dark'
        themeParams: Record<string, string>
        MainButton: {
          text: string
          show(): void
          hide(): void
          onClick(cb: () => void): void
          offClick(cb: () => void): void
          setText(text: string): void
        }
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy'): void
          notificationOccurred(type: 'error' | 'success' | 'warning'): void
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
      tg.expand()   // разворачиваем на весь экран
    }
  }, [])

  const user = tg?.initDataUnsafe?.user
  const initData = tg?.initData ?? ''
  const isDark = tg?.colorScheme === 'dark'

  const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    tg?.HapticFeedback?.impactOccurred(style)
  }

  return { tg, user, initData, isDark, haptic }
}
