import { useEffect, useState } from 'react'
import { UserPlus, Users, Heart, Bookmark, X, Plus, Copy, Check, Share2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchFriends, addFriend as apiAddFriend, removeFriend as apiRemoveFriend,
  fetchSharedWishlists, createSharedWishlist, fetchWishlist, fetchMe,
  FriendData, SharedWishlistData, WishlistItem,
} from '../api/client'
import { useToast } from '../components/Toast'

const TABS = ['Активность', 'Общие вишлисты']

function FriendSheet({ friend, onClose, onCreatedWishlist }: {
  friend: FriendData; onClose: () => void; onCreatedWishlist: (id: string) => void
}) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [creating, setCreating] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    fetchWishlist().then(items => setWishlistItems(items.slice(0, 4))).catch(console.error)
  }, [])

  async function handleCreateSharedWishlist() {
    setCreating(true)
    try {
      const sw = await createSharedWishlist(`С ${friend.friend_name}`)
      show('Совместный вишлист создан!')
      onCreatedWishlist(sw.id)
    } catch (e) {
      console.error('create shared wishlist failed', e)
      show('Не удалось создать вишлист')
    } finally {
      setCreating(false)
    }
  }

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
              {friend.friend_handle && <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{friend.friend_handle}</div>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            Поделиться вещами из своего вишлиста
          </div>
          {wishlistItems.length > 0 ? (
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
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)', marginBottom: 16 }}>
              Вишлист пуст
            </div>
          )}

          <button onClick={handleCreateSharedWishlist} disabled={creating} style={{
            width: '100%', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: creating ? 0.7 : 1,
          }}>
            <Users size={18} />
            {creating ? 'Создаём...' : 'Создать совместный вишлист'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddFriendModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, handle?: string) => void }) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: '100%', maxWidth: 400, margin: 'auto',
        background: 'var(--surface)', borderRadius: 20, overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Добавить друга</h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text2)'
          }}><X size={14} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Имя друга"
            style={{
              width: '100%', padding: 14, borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--surface2)',
              fontSize: 15, color: 'var(--text)'
            }}
          />
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            placeholder="@username (необязательно)"
            style={{
              width: '100%', padding: 14, borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--surface2)',
              fontSize: 15, color: 'var(--text)'
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: 14, borderRadius: 12, border: 'none',
              background: 'var(--surface2)', color: 'var(--text)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer'
            }}>Отмена</button>
            <button
              onClick={() => name.trim() && onAdd(name.trim(), handle.trim() || undefined)}
              disabled={!name.trim()}
              style={{
                flex: 1, padding: 14, borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: name.trim() ? 1 : 0.5
              }}>Добавить</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateWishlistModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: '100%', maxWidth: 400, margin: 'auto',
        background: 'var(--surface)', borderRadius: 20, overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Новый вишлист</h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text2)'
          }}><X size={14} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Название вишлиста"
            onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim())}
            style={{
              width: '100%', padding: 14, borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--surface2)',
              fontSize: 15, color: 'var(--text)'
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: 14, borderRadius: 12, border: 'none',
              background: 'var(--surface2)', color: 'var(--text)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer'
            }}>Отмена</button>
            <button
              onClick={() => name.trim() && onCreate(name.trim())}
              disabled={!name.trim()}
              style={{
                flex: 1, padding: 14, borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: name.trim() ? 1 : 0.5
              }}>Создать</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityIcon({ activity }: { activity: string }) {
  if (activity?.includes('лайкнул') || activity?.includes('сохранил')) return <Heart size={13} fill="var(--red)" stroke="none" />
  if (activity?.includes('добавил')) return <Bookmark size={13} color="var(--accent)" />
  if (activity?.includes('создал')) return <Users size={13} color="var(--green)" />
  return <Heart size={13} color="var(--text3)" />
}

export default function FriendsPage() {
  const [tab, setTab] = useState('Активность')
  const [friends, setFriends] = useState<FriendData[]>([])
  const [sharedWishlists, setSharedWishlists] = useState<SharedWishlistData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<FriendData | null>(null)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showCreateWishlist, setShowCreateWishlist] = useState(false)
  const [copied, setCopied] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const { show, node } = useToast()
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [friendsData, swData, me] = await Promise.all([
        fetchFriends(), fetchSharedWishlists(), fetchMe(),
      ])
      setFriends(friendsData)
      setSharedWishlists(swData)
      setReferralCode(me.referral_code)
    } catch (e) {
      console.error('load friends data failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function addFriend(name: string, handle?: string) {
    try {
      const friend = await apiAddFriend(name, handle)
      setFriends(prev => [friend, ...prev])
      setShowAddFriend(false)
      show('Друг добавлен!')
    } catch (e) {
      console.error('add friend failed', e)
    }
  }

  async function createWishlist(name: string) {
    try {
      const sw = await createSharedWishlist(name)
      setSharedWishlists(prev => [sw, ...prev])
      setShowCreateWishlist(false)
      show('Вишлист создан!')
      navigate(`/shared/${sw.id}`)
    } catch (e) {
      console.error('create wishlist failed', e)
    }
  }

  async function removeFriend(id: string) {
    try {
      await apiRemoveFriend(id)
      setFriends(prev => prev.filter(f => f.id !== id))
      show('Друг удалён')
    } catch (e) {
      console.error('remove friend failed', e)
    }
  }

  const referralLink = typeof window !== 'undefined' && referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : ''

  async function copyReferralLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      show('Ссылка скопирована!')
    } catch {
      show('Не удалось скопировать')
    }
  }

  return (
    <div className="page-bg" style={{ paddingBottom: 20 }}>
      {node}
      {selectedFriend && (
        <FriendSheet
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          onCreatedWishlist={id => { setSelectedFriend(null); navigate(`/shared/${id}`) }}
        />
      )}
      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} onAdd={addFriend} />}
      {showCreateWishlist && <CreateWishlistModal onClose={() => setShowCreateWishlist(false)} onCreate={createWishlist} />}

      <div className="page-header">
        <div className="page-title">Друзья</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="header-action-btn"
            onClick={copyReferralLink}
            title="Пригласить друзей"
          >
            {copied ? <Check size={20} color="var(--green)" /> : <Share2 size={20} />}
          </button>
          <button
            className="header-action-btn"
            onClick={() => setShowAddFriend(true)}
            title="Добавить друга"
          >
            <UserPlus size={22} />
          </button>
        </div>
      </div>

      {/* Referral banner */}
      <div style={{
        margin: '0 16px 12px',
        background: 'linear-gradient(135deg, var(--accent-light) 0%, rgba(108,78,242,0.15) 100%)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Share2 size={20} color="var(--accent)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Пригласите друзей</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Получайте бонусы за каждого приглашённого</div>
        </div>
        <button
          onClick={copyReferralLink}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '8px 14px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Готово' : 'Копировать'}
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
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Добавьте друзей и делитесь вишлистами</div>
              <button
                onClick={() => setShowAddFriend(true)}
                style={{
                  marginTop: 16, background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <UserPlus size={18} />
                Добавить друга
              </button>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map(f => (
                <div key={f.id} className="friend-item">
                  <div
                    className="friend-avatar-placeholder"
                    style={{ background: f.friend_avatar_color }}
                    onClick={() => setSelectedFriend(f)}
                  >
                    {f.friend_initials}
                  </div>
                  <div className="friend-info" onClick={() => setSelectedFriend(f)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="friend-name">{f.friend_name}</span>
                      {f.friend_handle && <span style={{ fontSize: 12, color: 'var(--text2)' }}>@{f.friend_handle}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <ActivityIcon activity={f.last_activity || ''} />
                      <span className="friend-activity">{f.last_activity || 'Недавно'}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFriend(f.id) }}
                    style={{
                      padding: 8, background: 'none', border: 'none',
                      color: 'var(--text3)', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {sharedWishlists.length === 0 ? (
            <div className="page-center" style={{ minHeight: '30vh' }}>
              <Bookmark size={48} color="var(--text3)" />
              <div style={{ fontSize: 15, color: 'var(--text2)' }}>Нет совместных вишлистов</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Создайте первый и делитесь с друзьями</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sharedWishlists.map(wl => (
                <div
                  key={wl.id}
                  onClick={() => navigate(`/shared/${wl.id}`)}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                >
                  {wl.preview_images.length > 0 && (
                    <div style={{ display: 'flex', height: 90, overflow: 'hidden', gap: 2 }}>
                      {wl.preview_images.map((url, j) => (
                        <div key={j} style={{ flex: 1, background: 'var(--surface2)' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding: '12px 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                        {wl.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                        <Users size={12} />
                        {wl.member_count} участника · {wl.product_count} товаров
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
          )}

          <button
            onClick={() => setShowCreateWishlist(true)}
            className="friends-invite-btn"
            style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Plus size={18} />
            Создать общий вишлист
          </button>
        </div>
      )}
    </div>
  )
}
