import { useEffect, useState } from 'react'
import { UserPlus, Users, Bookmark, X, Plus, Copy, Check, Share2, Trash2, Heart, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchFriends, connectFriend, removeFriend as apiRemoveFriend,
  fetchSharedWishlists, createSharedWishlist, fetchWishlist, fetchMyCollections, fetchMe,
  shareProductToFriend, shareCollectionToFriend,
  formatPrice,
  FriendData, SharedWishlistData, WishlistItem, CollectionData,
} from '../api/client'
import { useToast } from '../components/Toast'

const TABS = ['Друзья', 'Общие вишлисты']

function FriendSheet({ friend, onClose, onRemoved }: {
  friend: FriendData; onClose: () => void; onRemoved: (id: string) => void
}) {
  const [mode, setMode] = useState<'menu' | 'product' | 'collection'>('menu')
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [myCollections, setMyCollections] = useState<CollectionData[]>([])
  const [busy, setBusy] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    if (mode === 'product' && wishlistItems.length === 0) {
      fetchWishlist().then(setWishlistItems).catch(console.error)
    }
    if (mode === 'collection' && myCollections.length === 0) {
      fetchMyCollections().then(setMyCollections).catch(console.error)
    }
  }, [mode])

  async function sendProduct(productId: string) {
    setBusy(true)
    try {
      await shareProductToFriend(friend.id, productId)
      show(`Поделились с ${friend.first_name}!`)
      onClose()
    } catch (e) {
      console.error('share product failed', e)
    } finally {
      setBusy(false)
    }
  }

  async function sendCollection(collectionId: string) {
    setBusy(true)
    try {
      await shareCollectionToFriend(friend.id, collectionId)
      show(`Поделились с ${friend.first_name}!`)
      onClose()
    } catch (e) {
      console.error('share collection failed', e)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    try {
      await apiRemoveFriend(friend.id)
      onRemoved(friend.id)
      show('Удалено из друзей')
    } catch (e) {
      console.error('remove friend failed', e)
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
              background: friend.avatar_color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}>{friend.initials}</div>
            <div>
              <div className="modal-title">{friend.first_name}</div>
              {friend.username && <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{friend.username}</div>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '16px' }}>
          {mode === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setMode('product')} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: 14, borderRadius: 14, border: 'none', background: 'var(--surface2)',
                fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
              }}>
                <Heart size={18} color="var(--accent)" /> Поделиться товаром из вишлиста
              </button>
              <button onClick={() => setMode('collection')} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: 14, borderRadius: 14, border: 'none', background: 'var(--surface2)',
                fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
              }}>
                <Layers size={18} color="var(--accent)" /> Поделиться своей коллекцией
              </button>
              <button onClick={handleRemove} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: 14, borderRadius: 14, border: 'none', background: 'var(--red-light)',
                fontSize: 14, fontWeight: 600, color: 'var(--red)', cursor: 'pointer', marginTop: 8,
              }}>
                <Trash2 size={18} /> Удалить из друзей
              </button>
            </div>
          )}

          {mode === 'product' && (
            wishlistItems.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>Вишлист пуст</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, opacity: busy ? 0.5 : 1 }}>
                {wishlistItems.map(p => (
                  <div key={p.id} onClick={() => !busy && sendProduct(p.product_id)} style={{
                    background: 'var(--surface2)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer'
                  }}>
                    <img src={p.image_url || ''} alt={p.title} style={{
                      width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block'
                    }} />
                    <div style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      {formatPrice(p.price)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {mode === 'collection' && (
            myCollections.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>
                У вас пока нет своих коллекций — создайте на вкладке «Коллекции»
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: busy ? 0.5 : 1 }}>
                {myCollections.map(c => (
                  <div key={c.id} onClick={() => !busy && sendCollection(c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                    background: 'var(--surface2)', cursor: 'pointer',
                  }}>
                    {c.cover_image && <img src={c.cover_image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function ConnectByCodeModal({ myLink, onClose, onConnected }: {
  myLink: string; onClose: () => void; onConnected: (f: FriendData) => void
}) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const { show } = useToast()

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(myLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  async function connect() {
    if (!code.trim()) return
    setBusy(true)
    try {
      const friend = await connectFriend(code.trim())
      onConnected(friend)
      show(`Теперь вы друзья с ${friend.first_name}!`)
      onClose()
    } catch (e) {
      console.error('connect by code failed', e)
      show('Код не найден — проверьте и попробуйте снова')
    } finally {
      setBusy(false)
    }
  }

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
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Ваша ссылка</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, background: 'var(--surface2)',
                fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{myLink}</div>
              <button onClick={copyLink} style={{
                background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
                padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
              }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
              Отправьте её другу — как только он перейдёт по ссылке, вы автоматически станете друзьями
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Или введите код друга</div>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Например: aB3xY9zK"
              onKeyDown={e => e.key === 'Enter' && connect()}
              style={{
                width: '100%', padding: 14, borderRadius: 12,
                border: '1.5px solid var(--border)', background: 'var(--surface2)',
                fontSize: 15, color: 'var(--text)'
              }}
            />
            <button
              onClick={connect}
              disabled={!code.trim() || busy}
              style={{
                width: '100%', marginTop: 10, padding: 14, borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: code.trim() ? 1 : 0.5
              }}>{busy ? 'Подключаем...' : 'Подключить'}</button>
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

export default function FriendsPage() {
  const [tab, setTab] = useState('Друзья')
  const [friends, setFriends] = useState<FriendData[]>([])
  const [sharedWishlists, setSharedWishlists] = useState<SharedWishlistData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<FriendData | null>(null)
  const [showConnect, setShowConnect] = useState(false)
  const [showCreateWishlist, setShowCreateWishlist] = useState(false)
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

  function handleFriendConnected(f: FriendData) {
    setFriends(prev => prev.some(x => x.id === f.id) ? prev : [f, ...prev])
  }

  function handleFriendRemoved(id: string) {
    setFriends(prev => prev.filter(f => f.id !== id))
    setSelectedFriend(null)
  }

  const referralLink = typeof window !== 'undefined' && referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : ''

  async function copyReferralLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
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
          onRemoved={handleFriendRemoved}
        />
      )}
      {showConnect && (
        <ConnectByCodeModal
          myLink={referralLink}
          onClose={() => setShowConnect(false)}
          onConnected={handleFriendConnected}
        />
      )}
      {showCreateWishlist && <CreateWishlistModal onClose={() => setShowCreateWishlist(false)} onCreate={createWishlist} />}

      <div className="page-header">
        <div className="page-title">Друзья</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="header-action-btn" onClick={() => setShowConnect(true)} title="Добавить друга">
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
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Пригласите настоящих друзей</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Перейдя по ссылке, человек сразу попадёт к вам в друзья</div>
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
          <Copy size={14} /> Копировать
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

      {tab === 'Друзья' ? (
        <div style={{ padding: '0 16px' }}>
          {loading ? (
            <div className="page-center"><div className="spinner" /></div>
          ) : friends.length === 0 ? (
            <div className="page-center" style={{ minHeight: '30vh' }}>
              <Users size={48} color="var(--text3)" />
              <div style={{ fontSize: 15, color: 'var(--text2)' }}>Пока нет друзей</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
                Отправьте свою ссылку человеку — после перехода вы станете друзьями
              </div>
              <button
                onClick={() => setShowConnect(true)}
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
                    style={{ background: f.avatar_color }}
                    onClick={() => setSelectedFriend(f)}
                  >
                    {f.initials}
                  </div>
                  <div className="friend-info" onClick={() => setSelectedFriend(f)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="friend-name">{f.first_name}</span>
                      {f.username && <span style={{ fontSize: 12, color: 'var(--text2)' }}>@{f.username}</span>}
                    </div>
                    {f.last_activity && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <span className="friend-activity">{f.last_activity}</span>
                      </div>
                    )}
                  </div>
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
