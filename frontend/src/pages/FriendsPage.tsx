import { useEffect, useState } from 'react'
import { UserPlus, Users, Heart, Bookmark, X, ChevronRight } from 'lucide-react'
import { supabase, Friend, Product } from '../lib/supabase'
import { useToast } from '../components/Toast'

const TABS = ['Активность', 'Общие вишлисты']

const SHARED_WISHLISTS = [
  {
    name: 'Летний шопинг',
    members: [
      { initials: 'СА', color: '#FF9F0A' },
      { initials: 'МА', color: '#FF6B6B' },
    ],
    count: 12,
    previewProducts: [
      'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=200',
    ],
  },
  {
    name: 'Подарки 🎁',
    members: [
      { initials: 'ИЛ', color: '#34C759' },
      { initials: 'КА', color: '#FF375F' },
      { initials: 'СА', color: '#FF9F0A' },
    ],
    count: 8,
    previewProducts: [
      'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/1458867/pexels-photo-1458867.jpeg?auto=compress&cs=tinysrgb&w=200',
    ],
  },
  {
    name: 'Офисный стиль',
    members: [
      { initials: 'АН', color: '#AF52DE' },
      { initials: 'МА', color: '#FF6B6B' },
    ],
    count: 6,
    previewProducts: [
      'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=200',
    ],
  },
]

type FriendSheetProps = { friend: Friend; onClose: () => void }

function FriendSheet({ friend, onClose }: FriendSheetProps) {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])

  useEffect(() => {
    supabase.from('products').select('*').limit(4)
      .then(({ data }) => setWishlistItems(data || []))
  }, [])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: friend.friend_avatar_color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}>{friend.friend_initials}</div>
            <div>
              <div className="modal-title">{friend.friend_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{friend.friend_handle}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[{ label: 'Свайпов', val: '843' }, { label: 'Лайков', val: '201' }, { label: 'Вишлист', val: '34' }].map(s => (
              <div key={s.label} style={{
                flex: 1, background: 'var(--surface2)', borderRadius: 14, padding: '12px 8px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            Вишлист друга
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {wishlistItems.map(p => (
              <div key={p.id} style={{
                background: 'var(--surface2)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer'
              }}>
                <img src={p.image_url || ''} alt={p.title} style={{
                  width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block'
                }} />
                <div style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  {p.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            ))}
          </div>

          <button style={{
            width: '100%', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer'
          }}>
            Создать совместный вишлист
          </button>
        </div>
      </div>
    </div>
  )
}

function ActivityIcon({ activity }: { activity: string }) {
  if (activity.includes('лайкнул') || activity.includes('сохранил')) return <Heart size={13} fill="var(--red)" stroke="none" />
  if (activity.includes('добавила') || activity.includes('добавил')) return <Bookmark size={13} color="var(--accent)" />
  if (activity.includes('создал')) return <Users size={13} color="var(--green)" />
  return <Heart size={13} color="var(--text3)" />
}

export default function FriendsPage() {
  const [tab, setTab] = useState('Активность')
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const { show, node } = useToast()

  useEffect(() => {
    supabase.from('friends').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        setFriends(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="page-bg" style={{ paddingBottom: 20 }}>
      {node}
      {selectedFriend && <FriendSheet friend={selectedFriend} onClose={() => setSelectedFriend(null)} />}

      <div className="page-header">
        <div className="page-title">Друзья</div>
        <button className="header-action-btn" onClick={() => show('Ссылка для приглашения скопирована!')}>
          <UserPlus size={22} />
        </button>
      </div>

      <div className="friends-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`friends-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >{t}</button>
        ))}
      </div>

      {tab === 'Активность' ? (
        <div style={{ padding: '0 16px' }}>
          {loading ? (
            <div className="page-center"><div className="spinner" /></div>
          ) : friends.length === 0 ? (
            <div className="page-center" style={{ minHeight: '30vh' }}>
              <Users size={48} color="var(--text3)" />
              <div style={{ fontSize: 15, color: 'var(--text2)' }}>Нет друзей</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Пригласите друзей и смотрите их вишлисты</div>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map(f => (
                <div key={f.id} className="friend-item" onClick={() => setSelectedFriend(f)}>
                  <div
                    className="friend-avatar-placeholder"
                    style={{ background: f.friend_avatar_color }}
                  >
                    {f.friend_initials}
                  </div>
                  <div className="friend-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="friend-name">{f.friend_name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{f.friend_handle}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <ActivityIcon activity={f.last_activity || ''} />
                      <span className="friend-activity">{f.last_activity}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div className="friend-time">{f.activity_time}</div>
                    <ChevronRight size={14} color="var(--text3)" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="friends-invite-btn" style={{ marginTop: 14 }} onClick={() => show('Ссылка скопирована!')}>
            Пригласить друзей
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SHARED_WISHLISTS.map((wl, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onClick={() => show(`Открываем «${wl.name}»`)}
              >
                {/* Preview images strip */}
                <div style={{ display: 'flex', height: 90, overflow: 'hidden', gap: 2 }}>
                  {wl.previewProducts.map((url, j) => (
                    <div key={j} style={{ flex: 1, background: 'var(--surface2)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{wl.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex' }}>
                        {wl.members.map((m, j) => (
                          <div key={j} style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: m.color, color: '#fff',
                            fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginLeft: j > 0 ? -8 : 0,
                            border: '2px solid var(--surface)',
                          }}>{m.initials}</div>
                        ))}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {wl.members.length} участника · {wl.count} товаров
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    borderRadius: 10, padding: '6px 12px',
                    fontSize: 13, fontWeight: 600,
                  }}>
                    Открыть
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="friends-invite-btn" style={{ marginTop: 14 }} onClick={() => show('Вишлист создан!')}>
            + Создать общий вишлист
          </button>
        </div>
      )}
    </div>
  )
}
