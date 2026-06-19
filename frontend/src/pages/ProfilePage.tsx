import { useState } from 'react'
import { Settings, Clock, Layers, SlidersHorizontal, ChevronRight, Bell, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NotificationsSheet from '../components/NotificationsSheet'
import { useToast } from '../components/Toast'
import { useTheme } from '../lib/theme'

const ACHIEVEMENTS = [
  { emoji: '🏆', earned: true, label: 'Первый свайп' },
  { emoji: '💎', earned: true, label: 'Стиляга' },
  { emoji: '🎯', earned: true, label: 'Снайпер скидок' },
  { emoji: '🔥', earned: false, label: '100 лайков' },
  { emoji: '👑', earned: false, label: 'Король моды' },
]

export default function ProfilePage() {
  const [showNotifs, setShowNotifs] = useState(false)
  const navigate = useNavigate()
  const { show, node } = useToast()
  const { theme } = useTheme()

  return (
    <div className="page-bg" style={{ paddingBottom: 16 }}>
      {node}
      {showNotifs && <NotificationsSheet onClose={() => setShowNotifs(false)} />}

      <div className="profile-header">
        <div className="profile-user-row">
          <div className="profile-avatar">А</div>
          <div>
            <div className="profile-name">Александра</div>
            <div className="profile-handle">@sasha.style</div>
          </div>
        </div>
        <button className="profile-settings-btn" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </button>
      </div>

      <div className="profile-stats-row">
        <div className="profile-stat-card">
          <div className="profile-stat-value">1 204</div>
          <div className="profile-stat-label">Свайпов</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">312</div>
          <div className="profile-stat-label">Лайков</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">78</div>
          <div className="profile-stat-label">Вишлист</div>
        </div>
      </div>

      <div className="profile-achievements-section">
        <div className="profile-achievements-title">Достижения</div>
        <div className="profile-achievements-row">
          {ACHIEVEMENTS.map((a, i) => (
            <div
              key={i}
              className={`profile-achievement-badge${a.earned ? ' earned' : ''}`}
              title={a.label}
              style={{ opacity: a.earned ? 1 : 0.35 }}
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
          <div style={{
            background: 'var(--red)', color: '#fff',
            fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '2px 7px', marginRight: 8,
          }}>3</div>
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
        <div className="profile-menu-item" onClick={() => navigate('/admin')}>
          <div className="profile-menu-icon" style={{ background: 'rgba(255,159,10,0.12)', color: 'var(--orange)' }}>
            <Shield size={18} />
          </div>
          <div className="profile-menu-label">Админ панель</div>
          <ChevronRight size={16} className="profile-menu-arrow" />
        </div>
      </div>
    </div>
  )
}
