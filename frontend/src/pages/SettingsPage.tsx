import { useState } from 'react'
import { ArrowLeft, Moon, Sun, Bell, Star, Globe, Smartphone, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/theme'
import { useToast } from '../components/Toast'

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className={`toggle-switch${on ? ' on' : ''}`}
      onClick={e => { e.stopPropagation(); onToggle() }}
    />
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { show, node } = useToast()

  const [notifPriceDrop, setNotifPriceDrop] = useState(true)
  const [notifNewInColl, setNotifNewInColl] = useState(true)
  const [notifFriendActivity, setNotifFriendActivity] = useState(false)
  const [notifBattles, setNotifBattles] = useState(true)

  return (
    <div className="page-bg" style={{ paddingBottom: 32 }}>
      {node}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700 }}>Настройки</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Theme */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text2)', marginBottom: 12 }}>
          Тема приложения
        </div>
        <div className="theme-chips">
          <button
            className={`theme-chip theme-chip--light${theme === 'light' ? ' active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={18} /> Светлая
          </button>
          <button
            className={`theme-chip theme-chip--dark${theme === 'dark' ? ' active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={18} /> Тёмная
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text2)', marginBottom: 12 }}>
          Уведомления
        </div>
        <div className="settings-section">
          <div className="settings-row">
            <div className="settings-row__icon" style={{ background: 'var(--red-light)' }}>
              <Bell size={16} color="var(--red)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="settings-row__label">Снижение цены</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>Когда цена упадёт в вишлисте</div>
            </div>
            <Toggle on={notifPriceDrop} onToggle={() => setNotifPriceDrop(v => !v)} />
          </div>
          <div className="settings-row">
            <div className="settings-row__icon" style={{ background: 'var(--accent-light)' }}>
              <Star size={16} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="settings-row__label">Новинки в коллекциях</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>Обновления подписок</div>
            </div>
            <Toggle on={notifNewInColl} onToggle={() => setNotifNewInColl(v => !v)} />
          </div>
          <div className="settings-row">
            <div className="settings-row__icon" style={{ background: 'rgba(52,199,89,0.12)' }}>
              <Globe size={16} color="var(--green)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="settings-row__label">Активность друзей</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>Вишлисты и лайки</div>
            </div>
            <Toggle on={notifFriendActivity} onToggle={() => setNotifFriendActivity(v => !v)} />
          </div>
          <div className="settings-row">
            <div className="settings-row__icon" style={{ background: 'rgba(255,159,10,0.12)' }}>
              <Smartphone size={16} color="var(--orange)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="settings-row__label">Батлы</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>Новые голосования</div>
            </div>
            <Toggle on={notifBattles} onToggle={() => setNotifBattles(v => !v)} />
          </div>
        </div>
      </div>

      {/* Retake onboarding */}
      <div style={{ padding: '0 16px' }}>
        <div className="settings-section">
          <div className="settings-row" onClick={() => {
            localStorage.removeItem('onboarding_done')
            window.location.href = '/'
          }}>
            <div className="settings-row__icon" style={{ background: 'var(--accent-light)' }}>
              <Star size={16} color="var(--accent)" />
            </div>
            <div className="settings-row__label">Перепройти анкету вкуса</div>
            <ChevronRight size={16} className="settings-row__arrow" />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', padding: '28px 0 0' }}>
        Swipe Fashion v1.0.0
      </div>
    </div>
  )
}
