import { useEffect, useState } from 'react'
import { X, Send } from 'lucide-react'
import { fetchFriends, shareProductToFriend, FriendData } from '../api/client'
import { useToast } from './Toast'

export default function ShareProductSheet({ productId, productTitle, onClose }: {
  productId: string; productTitle?: string; onClose: () => void
}) {
  const [friends, setFriends] = useState<FriendData[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const { show, node } = useToast()

  useEffect(() => {
    fetchFriends().then(setFriends).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function send(friendId: string, name: string) {
    setBusyId(friendId)
    try {
      await shareProductToFriend(friendId, productId)
      show(`Поделились с ${name}!`)
      onClose()
    } catch (e) {
      console.error('share product failed', e)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {node}
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Поделиться{productTitle ? `: ${productTitle.slice(0, 24)}` : ''}</h3>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '4px 16px 20px' }}>
          {loading ? (
            <div className="page-center" style={{ minHeight: '20vh' }}><div className="spinner" /></div>
          ) : friends.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
              Сначала добавьте друзей на вкладке «Друзья»
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: busyId ? 0.6 : 1 }}>
              {friends.map(f => (
                <div
                  key={f.id}
                  onClick={() => !busyId && send(f.id, f.first_name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                    background: 'var(--surface2)', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: f.avatar_color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                  }}>{f.initials}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{f.first_name}</div>
                  <Send size={15} color="var(--accent)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
