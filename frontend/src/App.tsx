import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import FeedPage from './pages/FeedPage'
import CollectionsPage from './pages/CollectionsPage'
import WishlistPage from './pages/WishlistPage'
import BattlesPage from './pages/BattlesPage'
import ProfilePage from './pages/ProfilePage'
import CapsulePage from './pages/CapsulePage'
import ForYouPage from './pages/ForYouPage'
import FriendsPage from './pages/FriendsPage'
import DealsPage from './pages/DealsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'
import { supabase } from './lib/supabase'
import { ThemeProvider } from './lib/theme'
import './styles.css'

function NavIcon({ d }: { d: React.ReactNode }) {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  )
}

function AppShell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [onboardingDone, setOnboardingDone] = useState<boolean>(
    () => Boolean(localStorage.getItem('onboarding_done'))
  )

  useEffect(() => {
    supabase.from('notifications').select('id', { count: 'exact' }).eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0))

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        supabase.from('notifications').select('id', { count: 'exact' }).eq('read', false)
          .then(({ count }) => setUnreadCount(count || 0))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!onboardingDone) {
    return (
      <div className="app">
        <OnboardingPage onDone={() => setOnboardingDone(true)} />
      </div>
    )
  }

  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/"            element={<FeedPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/wishlist"    element={<WishlistPage />} />
          <Route path="/battles"     element={<BattlesPage />} />
          <Route path="/deals"       element={<DealsPage />} />
          <Route path="/friends"     element={<FriendsPage />} />
          <Route path="/capsule"     element={<CapsulePage />} />
          <Route path="/foryou"      element={<ForYouPage />} />
          <Route path="/profile"     element={<ProfilePage />} />
          <Route path="/history"     element={<HistoryPage />} />
          <Route path="/settings"    element={<SettingsPage />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <NavIcon d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>} />
          <span className="nav-label">Лента</span>
        </NavLink>

        <NavLink to="/collections" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <NavIcon d={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>} />
          <span className="nav-label">Коллекции</span>
        </NavLink>

        <NavLink to="/wishlist" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <NavIcon d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />} />
          <span className="nav-label">Вишлист</span>
        </NavLink>

        <NavLink to="/battles" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <NavIcon d={<><path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l-2 2H3v-8l2-2" /><path d="M9.5 6.5L21 18v3h-3L6.5 9.5" /></>} />
          <span className="nav-label">Батлы</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <NavIcon d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
              <span className="nav-label">Профиль</span>
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </>
          )}
        </NavLink>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  )
}
