import { useEffect, useState } from 'react'
import { Settings, Clock, Layers, SlidersHorizontal, ChevronRight, Bell, Shield, Users, Flame } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NotificationsSheet from '../components/NotificationsSheet'
import { useToast } from '../components/Toast'
import { useTheme } from '../lib/theme'
import { fetchProfile, fetchUnreadCount, getCachedProfile, ProfileData } from '../api/client'

export default function ProfilePage() {
  const [showNotifs, setShowNotifs] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(() => getCachedProfile())
  const [loading, setLoading] = useState(!getCachedProfile())
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  const { node } = useToast()
  const { theme } = useTheme()

  useEffect(() => { load() }, [])

  function load() {
    // Если в кэше уже есть данные — показываем их сразу и обновляем в фоне,
    // без мигания спиннером. Если кэша нет (самый первый заход) — короткая
    // загрузка неизбежна, но App.tsx уже прогревает кэш заранее.
    fetchProfile().then(setProfile).catch(console.error).finally(() => setLoading(false))
    fetchUnreadCount().then(r => setUnread(r.count)).catch(console.error)
  }

  const initial = profile ? (profile.first_name || '?').slice(0, 1).toUpperCase() : ''

  return (
    <div className="page-bg" style={{ paddingBottom: 16 }}>
      {node}
      {showNotifs && (
        <NotificationsSheet
          onClose={() => setShowNotifs(false)}
          onChange={() => fetchUnreadCount().then(r => setUnread(r.count)).catch(() => {})}
        />
      )}

      <div className="profile-header">
        <div className="profile-user-row">
          <div className="profile-avatar">
            {loading ? <span className="skeleton-bar" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : initial}
          </div>
          <div>
            {loading ? (
              <>
                <div className="skeleton-bar" style={{ width: 110, height: 16, marginBottom: 6 }} />
                <div className="skeleton-bar" style={{ width: 80, height: 12 }} />
              </>
            ) : (
              <>
                <div className="profile-name">{profile?.first_name || 'Гость'}</div>
                <div className="profile-handle">
                  {profile?.username ? `@${profile.username}` : `с нами с ${profile ? new Date(profile.member_since).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : ''}`}
                </div>
              </>
            )}
          </div>
        </div>
        <button className="profile-settings-btn" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </button>
      </div>

      <div className="profile-stats-row">
        <div className="profile-stat-card">
          <div className="profile-stat-value">{profile ? profile.total_swipes.toLocaleString('ru-RU') : '—'}</div>
          <div className="profile-stat-label">Свайпов</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{profile ? profile.likes.toLocaleString('ru-RU') : '—'}</div>
          <div className="profile-stat-label">Лайков</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{profile ? profile.wishlist_count.toLocaleString('ru-RU') : '—'}</div>
          <div className="profile-stat-label">Вишлист</div>
        </div>
      </div>

      <div className="profile-achievements-section">
        <div className="profile-achievements-title">Достижения</div>
        <div className="profile-achievements-row">
          {(profile?.achievements || []).map(a => (
            <div
              key={a.id}
              className={`profile-achievement-badge${a.unlocked ? ' earned' : ''}`}
              title={`${a.title} — ${a.description} (${a.progress}/${a.target})`}
              style={{ opacity: a.unlocked ? 1 : 0.35 }}
            >
              {a.emoji}
            </div>
          ))}
        </div>
      </div>

      <div className="profile-menu-section">
        <div className="profile-menu-item" onClick={() => setShowNotifs(true)}>
          <div className="profile-menu-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
            <Bell size={18} />
          </div>
          <div className="profile-menu-label">Уведомления</div>
          {unread > 0 && (
            <div style={{
              background: 'var(--red)', color: '#fff',
              fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '2px 7px', marginRight: 8,
            }}>{unread}</div>
          )}
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/friends')}>
          <div className="profile-menu-icon" style={{ background: 'rgba(108,78,242,0.10)', color: 'var(--accent)' }}>
            <Users size={18} />
          </div>
          <div className="profile-menu-label">Друзья</div>
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/deals')}>
          <div className="profile-menu-icon" style={{ background: 'rgba(255,69,58,0.10)', color: 'var(--orange)' }}>
            <Flame size={18} />
          </div>
          <div className="profile-menu-label">Скидки</div>
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/history')}>
          <div className="profile-menu-icon" style={{ background: 'rgba(255,159,10,0.12)', color: 'var(--orange)' }}>
            <Clock size={18} />
          </div>
          <div className="profile-menu-label">История свайпов</div>
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/capsule')}>
          <div className="profile-menu-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Layers size={18} />
          </div>
          <div className="profile-menu-label">Мои капсулы</div>
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/foryou')}>
          <div className="profile-menu-icon" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
            <SlidersHorizontal size={18} />
          </div>
          <div className="profile-menu-label">Для тебя</div>
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/settings')}>
          <div className="profile-menu-icon"><Settings size={18} /></div>
          <div className="profile-menu-label">Настройки</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginRight: 4 }}>
            {theme === 'dark' ? 'Тёмная' : 'Светлая'}
          </div>
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
        {profile?.is_admin && (
          <div className="profile-menu-item" onClick={() => navigate('/admin')}>
            <div className="profile-menu-icon" style={{ background: 'rgba(255,159,10,0.12)', color: 'var(--orange)' }}>
              <Shield size={18} />
            </div>
            <div className="profile-menu-label">Админ панель</div>
            <ChevronRight size={16} className="profile-menu-arrow" />
          </div>
        )}
      </div>
    </div>
  )
}
