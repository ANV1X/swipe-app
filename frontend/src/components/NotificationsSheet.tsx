import { useEffect, useState } from 'react'
import { TrendingDown, Package, Bookmark, X } from 'lucide-react'
import { supabase, Notification } from '../lib/supabase'

type Props = { onClose: () => void }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d >= 1) return `${d} д. назад`
  if (h >= 1) return `${h} ч. назад`
  return 'только что'
}

function NotifIcon({ type }: { type: string }) {
  const cls = `notif-icon notif-icon--${type}`
  if (type === 'price_drop') return <div className={cls}><TrendingDown size={18} /></div>
  if (type === 'back_in_stock') return <div className={cls}><Package size={18} /></div>
  return <div className={cls}><Bookmark size={18} /></div>
}

export default function NotificationsSheet({ onClose }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('notifications')
      .select('*, products(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotifications((data || []) as Notification[])
        setLoading(false)
      })
  }, [])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">
            Уведомления
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8, background: 'var(--accent)', color: '#fff',
                fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '2px 7px',
                verticalAlign: 'middle'
              }}>{unreadCount}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >Всё прочитано</button>
            )}
            <button className="modal-close" onClick={onClose}><X size={14} /></button>
          </div>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="page-center"><div className="spinner" /></div>
          ) : notifications.length === 0 ? (
            <div className="page-center">
              <div style={{ fontSize: 14, color: 'var(--text2)' }}>Нет уведомлений</div>
            </div>
          ) : (
            <div className="notifications-sheet">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="notif-item"
                  onClick={() => markRead(n.id)}
                  style={{ opacity: n.read ? 0.6 : 1 }}
                >
                  <NotifIcon type={n.type} />
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                    <div className="notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read && <div className="notif-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
