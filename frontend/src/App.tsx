import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Feed from './pages/Feed'
import Wishlist from './pages/Wishlist'
import Deals from './pages/Deals'
import Profile from './pages/Profile'
import History from './pages/History'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'
import Onboarding, { OnboardingPrefs } from './pages/Onboarding'
import { SharedWishlistList, SharedWishlistDetail } from './pages/SharedWishlist'
import { useTelegram } from './hooks/useTelegram'
import { setInitData } from './api/client'
import './styles.css'

const PREFS_KEY = 'swipe_prefs_v2'
const THEME_KEY = 'swipe_theme'

function loadPrefs(): OnboardingPrefs | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
  if (theme === 'dark') {
    document.documentElement.style.setProperty('--bg',      '#111110')
    document.documentElement.style.setProperty('--surface', '#1C1C1B')
    document.documentElement.style.setProperty('--surface2','#252523')
    document.documentElement.style.setProperty('--text',    '#F5F2EC')
    document.documentElement.style.setProperty('--text2',   '#A8A5A0')
    document.documentElement.style.setProperty('--text3',   '#6B6863')
    document.documentElement.style.setProperty('--border',  '#2E2E2C')
  } else {
    document.documentElement.style.setProperty('--bg',      '#F8F7F5')
    document.documentElement.style.setProperty('--surface', '#FFFFFF')
    document.documentElement.style.setProperty('--surface2','#F2F0EC')
    document.documentElement.style.setProperty('--text',    '#1A1A1A')
    document.documentElement.style.setProperty('--text2',   '#6B6863')
    document.documentElement.style.setProperty('--text3',   '#A8A5A0')
    document.documentElement.style.setProperty('--border',  '#E8E5E0')
  }
}

export default function App() {
  const { initData, isDark } = useTelegram()
  const [prefs, setPrefs] = useState<OnboardingPrefs | null>(null)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showSettings, setShowSettings] = useState(false)

  // Загружаем prefs после монтирования
  useEffect(() => {
    const saved = loadPrefs()
    setPrefs(saved)
    setPrefsLoaded(true)
    const savedTheme = (localStorage.getItem(THEME_KEY) as 'light' | 'dark') ?? (isDark ? 'dark' : 'light')
    setTheme(savedTheme)
  }, [])

  useEffect(() => { setInitData(initData) }, [initData])
  useEffect(() => { applyTheme(theme) }, [theme])

  const handleThemeChange = (t: 'light' | 'dark') => setTheme(t)

  // Пока не загрузили prefs — показываем пустой экран
  if (!prefsLoaded) return <div className="app" />

  if (!prefs) {
    return (
      <div className="app">
        <Onboarding onDone={p => {
          localStorage.setItem(PREFS_KEY, JSON.stringify(p))
          setPrefs(p)
        }} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="app">
        <main className="main-content">
          <Routes>
            <Route path="/"             element={<Feed prefs={prefs} />} />
            <Route path="/wishlist"     element={<Wishlist />} />
            <Route path="/deals"        element={<Deals />} />
            <Route path="/shared"       element={<SharedWishlistList />} />
            <Route path="/shared/:id"   element={<SharedWishlistDetail />} />
            <Route path="/profile"      element={<Profile onSettingsOpen={() => setShowSettings(true)} />} />
            <Route path="/history"      element={<History />} />
            <Route path="/achievements" element={<Achievements />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🔥</span>
            <span className="nav-label">Лента</span>
          </NavLink>
          <NavLink to="/wishlist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🤍</span>
            <span className="nav-label">Вишлист</span>
          </NavLink>
          <NavLink to="/deals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🏷️</span>
            <span className="nav-label">Скидки</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">Профиль</span>
          </NavLink>
        </nav>

        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <Settings
                theme={theme}
                onThemeChange={handleThemeChange}
                onClose={() => setShowSettings(false)}
              />
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}
