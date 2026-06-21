import { useEffect, useState } from 'react'
import { TrendingDown, Package, Bookmark, X, Users, Gift, Layers, Swords, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, NotificationData } from '../api/client'

type Props = { onClose: () => void; onChange?: () => void }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d >= 1) return `${d} д. назад`
  if (h >= 1) return `${h} ч. назад`
  return 'только что'
}

const ICON_BY_TYPE: Record<string, { Icon: typeof Bookmark; cls: string }> = {
  price_drop: { Icon: TrendingDown, cls: 'notif-icon--price_drop' },
  back_in_stock: { Icon: Package, cls: 'notif-icon--back_in_stock' },
  new_in_collection: { Icon: Sparkles, cls: 'notif-icon--new_in_collection' },
  friend_activity: { Icon: Users, cls: 'notif-icon--friend_activity' },
  shared_product: { Icon: Gift, cls: 'notif-icon--shared_product' },
  shared_collection: { Icon: Layers, cls: 'notif-icon--shared_collection' },
  battle_matched: { Icon: Swords, cls: 'notif-icon--battle_matched' },
}

function NotifIcon({ type }: { type: string }) {
  const { Icon, cls } = ICON_BY_TYPE[type] ?? { Icon: Bookmark, cls: 'notif-icon--default' }
  return <div className={`notif-icon ${cls}`}><Icon size={18} /></div>
}

function navigateForNotification(n: NotificationData): string | null {
  if (n.type === 'shared_collection' || n.type === 'new_in_collection') return '/collections'
  if (n.type === 'shared_product' || n.type === 'price_drop' || n.type === 'back_in_stock') return '/wishlist'
  if (n.type === 'battle_matched') return '/battles'
  if (n.type === 'friend_activity') return '/friends'
  return null
}

export default function NotificationsSheet({ onClose, onChange }: Props) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleClick(n: NotificationData) {
    if (!n.read) {
      try {
        await markNotificationRead(n.id)
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
        onChange?.()
      } catch (e) {
        console.error('mark read failed', e)
      }
    }
    const dest = navigateForNotification(n)
    if (dest) {
      onClose()
      navigate(dest)
    }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      onChange?.()
    } catch (e) {
      console.error('mark all read failed', e)
    }
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
                  onClick={() => handleClick(n)}
                  style={{ opacity: n.read ? 0.6 : 1, cursor: 'pointer' }}
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
