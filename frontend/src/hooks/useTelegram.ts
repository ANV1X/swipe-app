import { useEffect, useState } from 'react'

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
        platform: string
        version: string
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
  const [tgData, setTgData] = useState<{
    initData: string
    user: { id: number; first_name: string; username?: string }
    isDark: boolean
  }>({
    initData: '',
    user: { id: 0, first_name: 'User' },
    isDark: false,
  })

  useEffect(() => {
    const init = () => {
      const tg = window.Telegram?.WebApp
      if (tg) {
        tg.ready()
        tg.expand()
        setTgData({
          initData: tg.initData || '',
          user: tg.initDataUnsafe?.user ?? { id: 0, first_name: 'User' },
          isDark: tg.colorScheme === 'dark',
        })
        console.log('TG OK, initData length:', tg.initData?.length)
      } else {
        console.log('No Telegram.WebApp after timeout')
      }
    }

    // Даём 500ms на загрузку telegram-web-app.js
    const timer = setTimeout(init, 500)
    return () => clearTimeout(timer)
  }, [])

  const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style) } catch { /* haptics unavailable */ }
  }

  return {
    tg: window.Telegram?.WebApp,
    user: tgData.user,
    initData: tgData.initData,
    isDark: tgData.isDark,
    haptic,
  }
}
