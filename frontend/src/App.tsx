import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import FeedPage from './pages/FeedPage'
import CollectionsPage from './pages/CollectionsPage'
import WishlistPage from './pages/WishlistPage'
import BattlesPage from './pages/BattlesPage'
import FriendsPage from './pages/FriendsPage'
import DealsPage from './pages/DealsPage'
import ProfilePage from './pages/ProfilePage'
import CapsulePage from './pages/CapsulePage'
import ForYouPage from './pages/ForYouPage'
import './styles.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <main className="main-content">
          <Routes>
            <Route path="/"             element={<FeedPage />} />
            <Route path="/collections"  element={<CollectionsPage />} />
            <Route path="/wishlist"     element={<WishlistPage />} />
            <Route path="/battles"      element={<BattlesPage />} />
            <Route path="/deals"        element={<DealsPage />} />
            <Route path="/friends"      element={<FriendsPage />} />
            <Route path="/capsule"      element={<CapsulePage />} />
            <Route path="/foryou"       element={<ForYouPage />} />
            <Route path="/profile"      element={<ProfilePage />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="nav-label">Лента</span>
          </NavLink>

          <NavLink to="/collections" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="nav-label">Коллекции</span>
          </NavLink>

          <NavLink to="/wishlist" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="nav-label">Вишлист</span>
          </NavLink>

          <NavLink to="/battles" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
              <path d="M13 19l-2 2H3v-8l2-2" />
              <path d="M9.5 6.5L21 18v3h-3L6.5 9.5" />
            </svg>
            <span className="nav-label">Батлы</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="nav-label">Профиль</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  )
}
