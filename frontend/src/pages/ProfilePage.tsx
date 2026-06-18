import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, ChevronRight, Clock, BookMarked, Cog, X, Moon, Sun, Bell, BellOff, Share2, LogOut } from 'lucide-react'

const ACHIEVEMENTS = [
  { id: 1, emoji: '🏆', label: 'Топ 1%', earned: true },
  { id: 2, emoji: '🎯', label: '100 лайков', earned: true },
  { id: 3, emoji: '⭐', label: 'Стилист', earned: true },
  { id: 4, emoji: '💎', label: 'Легенда', earned: false },
  { id: 5, emoji: '🔥', label: '7 дней', earned: false },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: on ? 'var(--accent)' : 'var(--border)',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.22s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 23 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        transition: 'left 0.22s',
      }} />
    </div>
  )
}

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [friendActivity, setFriendActivity] = useState(false)

  function SettingsRow({ icon, label, sub, right }: { icon: React.ReactNode; label: string; sub?: string; right?: React.ReactNode }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
        </div>
        {right}
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Настройки</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Appearance */}
          <div style={{ padding: '16px 20px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text3)' }}>
            Внешний вид
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 16px' }}>
            {[
              { key: false, label: 'Светлая', icon: <Sun size={20} color="#FF9F0A" /> },
              { key: true, label: 'Тёмная', icon: <Moon size={20} color="#5E5CE6" /> },
            ].map(opt => (
              <button
                key={String(opt.key)}
                onClick={() => setDarkMode(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 14,
                  border: darkMode === opt.key ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: darkMode === opt.key ? 'var(--accent-light)' : 'var(--surface)',
                  cursor: 'pointer',
                }}
              >
                {opt.icon}
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{opt.label}</span>
                {darkMode === opt.key && (
                  <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Notifications */}
          <div style={{ padding: '8px 20px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text3)' }}>
            Уведомления
          </div>
          <SettingsRow icon={<Bell size={18} />} label="Уведомления" sub="Включить все" right={<Toggle on={notifications} onChange={setNotifications} />} />
          <SettingsRow icon={<BellOff size={18} />} label="Снижение цены" sub="Оповещение при скидке" right={<Toggle on={priceAlerts} onChange={setPriceAlerts} />} />
          <SettingsRow icon={<Bell size={18} />} label="Активность друзей" right={<Toggle on={friendActivity} onChange={setFriendActivity} />} />

          {/* Account */}
          <div style={{ padding: '16px 20px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text3)' }}>
            Аккаунт
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', flexShrink: 0 }}>
              <Share2 size={18} />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Поделиться профилем</span>
            <ChevronRight size={18} color="var(--text3)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={18} color="var(--red)" />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--red)' }}>Выйти</span>
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [showSettings, setShowSettings] = useState(false)
  const navigate = useNavigate()

  const menuItems = [
    { icon: <Clock size={18} />, label: 'История свайпов', action: undefined },
    { icon: <BookMarked size={18} />, label: 'Мои капсулы', action: () => navigate('/capsule') },
    { icon: <Cog size={18} />, label: 'Настройки', action: () => setShowSettings(true) },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="profile-avatar">А</div>
          <div>
            <div className="profile-name">Александра</div>
            <div className="profile-handle">@sasha.style</div>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ width: 36, height: 36, border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' }}>
          <Settings size={22} />
        </button>
      </div>

      {/* Stats */}
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

      {/* Achievements */}
      <div className="cap-card" style={{ margin: '0 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="cap-section-label" style={{ marginBottom: 0 }}>Достижения</div>
          <ChevronRight size={16} color="var(--text3)" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {ACHIEVEMENTS.map(a => (
            <div
              key={a.id}
              style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: a.earned ? 'var(--accent-light)' : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}
            >
              <span style={{ filter: a.earned ? 'none' : 'grayscale(1) opacity(0.4)' }}>{a.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links to secondary screens */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 12px' }}>
        {[
          { label: 'Для тебя ✨', route: '/foryou', bg: 'var(--accent-light)', color: 'var(--accent)' },
          { label: 'Друзья', route: '/friends', bg: 'var(--surface)', color: 'var(--text)' },
          { label: 'Скидки 🔥', route: '/deals', bg: '#FFF0EE', color: 'var(--red)' },
        ].map(link => (
          <button
            key={link.label}
            onClick={() => navigate(link.route)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 14, border: 'none',
              background: link.bg, color: link.color,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >{link.label}</button>
        ))}
      </div>

      {/* Menu */}
      <div className="profile-menu-section">
        {menuItems.map((item, idx, arr) => (
          <div
            key={item.label}
            className="profile-menu-item"
            style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            onClick={item.action}
          >
            <div className="profile-menu-icon">{item.icon}</div>
            <span className="profile-menu-label">{item.label}</span>
            <ChevronRight size={18} className="profile-menu-arrow" />
          </div>
        ))}
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  )
}
