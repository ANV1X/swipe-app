import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Feed from './pages/Feed'
import Wishlist from './pages/Wishlist'
import Profile from './pages/Profile'
import History from './pages/History'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'
import Deals from './pages/Deals'
import Onboarding, { OnboardingPrefs } from './pages/Onboarding'
import { SharedWishlistList, SharedWishlistDetail } from './pages/SharedWishlist'
import { useTelegram } from './hooks/useTelegram'
import { setInitData } from './api/client'
import './styles.css'

// Создадим заглушку для Коллекций, пока ты не скинул этот файл
const CollectionsStub = () => (
  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text)' }}>
    <h2>Коллекции</h2>
    <p style={{ color: 'var(--text2)', marginTop: '8px' }}>Раздел в разработке</p>
  </div>
)

// Создадим заглушку для Батлов
const BattlesStub = () => (
  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text)' }}>
    <h2>Батлы 🔥</h2>
    <p style={{ color: 'var(--text2)', marginTop: '8px' }}>Кто сегодня победит?</p>
  </div>
)

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
  
  // Адаптируем палитру под пиксель-перфект макет (чистый светлый фон, глубокий фиолетовый акцент)
  if (theme === 'dark') {
    document.documentElement.style.setProperty('--bg',       '#000000')
    document.documentElement.style.setProperty('--surface',  '#1C1C1E')
    document.documentElement.style.setProperty('--surface2', '#2C2C2E')
    document.documentElement.style.setProperty('--accent',   '#6B4CFF') // Фиолетовый акцент для темной темы
    document.documentElement.style.setProperty('--text',     '#FFFFFF')
    document.documentElement.style.setProperty('--text2',    '#AEAEB2')
    document.documentElement.style.setProperty('--text3',    '#48484A')
    document.documentElement.style.setProperty('--border',   '#38383A')
  } else {
    document.documentElement.style.setProperty('--bg',       '#F2F2F7') // Нежно-серый фон iOS
    document.documentElement.style.setProperty('--surface',  '#FFFFFF') // Белоснежные карточки
    document.documentElement.style.setProperty('--surface2', '#F2F2F7')
    document.documentElement.style.setProperty('--accent',   '#5B42C3') // Тот самый сочный фиолетовый из макета
    document.documentElement.style.setProperty('--text',     '#000000') // Контрастный черный текст
    document.documentElement.style.setProperty('--text2',    '#8E8E93') // Второстепенный серый текст
    document.documentElement.style.setProperty('--text3',    '#C7C7CC')
    document.documentElement.style.setProperty('--border',   '#E5E5EA')
  }
}

export default function App() {
  const { initData, isDark } = useTelegram()
  const [prefs, setPrefs] = useState<OnboardingPrefs | null>(null)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitData(initData)
    }, 600)
    return () => clearTimeout(timer)
  }, [initData])

  useEffect(() => {
    const saved = loadPrefs()
    setPrefs(saved)
    setPrefsLoaded(true)
    const savedTheme = (localStorage.getItem(THEME_KEY) as 'light' | 'dark') ?? (isDark ? 'dark' : 'light')
    setTheme(savedTheme)
  }, [])

  useEffect(() => { applyTheme(theme) }, [theme])

  if (!prefsLoaded) {
    return (
      <div className="app" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    )
  }

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
      <div className="app" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main className="main-content" style={{ flex: 1, paddingBottom: '84px' }}>
          <Routes>
            <Route path="/"                 element={<Feed prefs={prefs} />} />
            <Route path="/collections"      element={<CollectionsStub />} />
            <Route path="/wishlist"         element={<Wishlist />} />
            <Route path="/battles"          element={<BattlesStub />} />
            <Route path="/deals"            element={<Deals />} />
            <Route path="/shared"           element={<SharedWishlistList />} />
            <Route path="/shared/:id"       element={<SharedWishlistDetail />} />
            <Route path="/profile"          element={<Profile onSettingsOpen={() => setShowSettings(true)} />} />
            <Route path="/history"          element={<History />} />
            <Route path="/achievements"     element={<Achievements />} />
          </Routes>
        </main>

        {/* Обновленный Bottom Nav на 5 вкладок точно по макету */}
        <nav className="bottom-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {/* Иконка Ленты (Лента) */}
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="nav-label">Лента</span>
          </NavLink>

          <NavLink to="/collections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {/* Иконка Коллекций (Коллекции) */}
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="nav-label">Коллекции</span>
          </NavLink>

          <NavLink to="/wishlist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {/* Иконка Сердца (Вишлист) */}
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="nav-label">Вишлист</span>
          </NavLink>

          <NavLink to="/battles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {/* Иконка Мечей/Батлов (Батлы) */}
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
              <path d="M13 19l-2 2H3v-8l2-2" />
              <path d="M9.5 6.5L21 18v3h-3L6.5 9.5" />
            </svg>
            <span className="nav-label">Батлы</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {/* Иконка Юзера (Профиль) */}
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="nav-label">Профиль</span>
          </NavLink>
        </nav>

        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <Settings
                theme={theme}
                onThemeChange={t => setTheme(t)}
                onClose={() => setShowSettings(false)}
              />
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}