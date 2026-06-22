import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MoreVertical, Heart, Layers, Swords, Trash2, X, ExternalLink } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchFriends, fetchFriendThread, removeFriend as apiRemoveFriend,
  fetchWishlist, fetchMyCollections, fetchActiveBattle,
  shareProductToFriend, shareCollectionToFriend, askFriendToVote,
  formatPrice,
  FriendData, ThreadItem, WishlistItem, CollectionData, BattleData,
} from '../api/client'
import { useToast } from '../components/Toast'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d >= 1) return `${d} д. назад`
  if (h >= 1) return `${h} ч. назад`
  return 'только что'
}

function ProductPicker({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  useEffect(() => { fetchWishlist().then(setItems).catch(console.error) }, [])
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Поделиться товаром</h3>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '4px 16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>Вишлист пуст</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {items.map(p => (
                <div key={p.id} onClick={() => onPick(p.product_id)} style={{
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
          )}
        </div>
      </div>
    </div>
  )
}

function CollectionPicker({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [items, setItems] = useState<CollectionData[]>([])
  useEffect(() => { fetchMyCollections().then(setItems).catch(console.error) }, [])
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Поделиться коллекцией</h3>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '4px 16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>
              У вас пока нет своих коллекций
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(c => (
                <div key={c.id} onClick={() => onPick(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                  background: 'var(--surface2)', cursor: 'pointer',
                }}>
                  {c.cover_image && <img src={c.cover_image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FriendThreadPage() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const { show, node } = useToast()

  const [friend, setFriend] = useState<FriendData | null>(null)
  const [thread, setThread] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [activeBattle, setActiveBattle] = useState<BattleData | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [friendId])

  async function load() {
    if (!friendId) return
    setLoading(true)
    try {
      const [friends, threadData, battle] = await Promise.all([
        fetchFriends(), fetchFriendThread(friendId), fetchActiveBattle().catch(() => null),
      ])
      setFriend(friends.find(f => f.id === friendId) || null)
      setThread(threadData)
      setActiveBattle(battle)
    } catch (e) {
      console.error('load thread failed', e)
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  async function sendProduct(productId: string) {
    if (!friendId) return
    try {
      await shareProductToFriend(friendId, productId)
      setShowProductPicker(false)
      show('Отправлено!')
      load()
    } catch (e) {
      console.error('share product failed', e)
    }
  }

  async function sendCollection(collectionId: string) {
    if (!friendId) return
    try {
      await shareCollectionToFriend(friendId, collectionId)
      setShowCollectionPicker(false)
      show('Отправлено!')
      load()
    } catch (e) {
      console.error('share collection failed', e)
    }
  }

  async function sendAskVote() {
    if (!friendId || !activeBattle) return
    try {
      await askFriendToVote(friendId, activeBattle.id)
      show('Позвали проголосовать!')
      load()
    } catch (e) {
      console.error('ask vote failed', e)
    }
  }

  async function handleRemove() {
    if (!friendId) return
    try {
      await apiRemoveFriend(friendId)
      show('Удалено из друзей')
      navigate('/friends')
    } catch (e) {
      console.error('remove friend failed', e)
    }
  }

  if (loading) return <div className="page-center" style={{ height: '100vh' }}><div className="spinner" /></div>
  if (!friend) return <div className="page-center" style={{ height: '100vh' }}><p>Друг не найден</p></div>

  return (
    <div className="page-bg" style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      {node}
      {showProductPicker && <ProductPicker onClose={() => setShowProductPicker(false)} onPick={sendProduct} />}
      {showCollectionPicker && <CollectionPicker onClose={() => setShowCollectionPicker(false)} onPick={sendCollection} />}

      <div className="page-header" style={{ flexShrink: 0, position: 'relative' }}>
        <button className="back-btn" onClick={() => navigate('/friends')}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: friend.avatar_color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
          }}>{friend.initials}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{friend.first_name}</div>
            {friend.last_activity && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{friend.last_activity}</div>}
          </div>
        </div>
        <button className="back-btn" onClick={() => setShowMenu(v => !v)}><MoreVertical size={18} /></button>
        {showMenu && (
          <div style={{
            position: 'absolute', top: '100%', right: 16, background: 'var(--surface)',
            borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden',
          }}>
            <button onClick={() => { setShowMenu(false); handleRemove() }} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'none',
              border: 'none', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              <Trash2 size={14} /> Удалить из друзей
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px' }}>
        {thread.length === 0 ? (
          <div className="page-center" style={{ minHeight: '50vh' }}>
            <div style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center' }}>
              Пока ничего не отправляли друг другу.<br />Поделитесь товаром или коллекцией!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {thread.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: item.is_mine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%',
                  background: item.is_mine ? 'var(--accent)' : 'var(--surface)',
                  color: item.is_mine ? '#fff' : 'var(--text)',
                  borderRadius: item.is_mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: 10,
                  boxShadow: item.is_mine ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  {item.type === 'shared_product' && item.product && (
                    <a
                      href={item.product.external_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', gap: 8, textDecoration: 'none', color: 'inherit' }}
                    >
                      <img src={item.product.image_url || ''} alt="" style={{ width: 56, height: 70, borderRadius: 8, objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Heart size={11} /> Товар
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.title}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{formatPrice(item.product.price)}</div>
                        <div style={{ fontSize: 10, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          Открыть <ExternalLink size={9} />
                        </div>
                      </div>
                    </a>
                  )}
                  {item.type === 'shared_collection' && item.collection && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {item.collection.cover_image && (
                        <img src={item.collection.cover_image} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Layers size={11} /> Коллекция
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.collection.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{item.collection.items_count} товаров</div>
                      </div>
                    </div>
                  )}
                  {item.type === 'battle_vote_request' && (
                    <div
                      onClick={() => navigate('/battles')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    >
                      <Swords size={16} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Просьба проголосовать</div>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>{item.body}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{timeAgo(item.created_at)}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div style={{
        flexShrink: 0, display: 'flex', gap: 8, padding: '10px 16px',
        borderTop: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <button onClick={() => setShowProductPicker(true)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 8px', borderRadius: 12, border: 'none', background: 'var(--surface2)',
          fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
        }}>
          <Heart size={14} /> Товар
        </button>
        <button onClick={() => setShowCollectionPicker(true)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 8px', borderRadius: 12, border: 'none', background: 'var(--surface2)',
          fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
        }}>
          <Layers size={14} /> Коллекция
        </button>
        {activeBattle && (
          <button onClick={sendAskVote} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 8px', borderRadius: 12, border: 'none', background: 'var(--accent-light)',
            fontSize: 12, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer',
          }}>
            <Swords size={14} /> Батл
          </button>
        )}
      </div>
    </div>
  )
}
