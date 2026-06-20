import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchSharedWishlists, createSharedWishlist, joinSharedWishlist,
  addToSharedWishlist, removeFromSharedWishlist,
  fetchWishlist, fetchMe, SharedWishlistData, WishlistItem,
  formatPrice, marketplaceLabel
} from '../api/client'

// ─── Список совместных вишлистов ─────────────────────────────────────────────
export function SharedWishlistList() {
  const [lists, setLists] = useState<SharedWishlistData[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSharedWishlists()
      .then(setLists)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const sw = await createSharedWishlist(newName.trim())
      setLists(prev => [sw, ...prev])
      setNewName('')
      setShowForm(false)
      navigate(`/shared/${sw.id}`)
    } catch (e) {
      console.error('create error', e)
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="page-center"><div className="spinner" /></div>

  return (
    <div className="shared-page">
      <div className="shared-header">
        <h1 className="page-title">Совместные</h1>
        <button className="btn-icon" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕' : '＋'}
        </button>
      </div>

      {showForm && (
        <div className="shared-create-form">
          <input
            className="shared-input"
            placeholder="Например: «Подарки на НГ»"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
          >
            {creating ? 'Создаём...' : 'Создать'}
          </button>
        </div>
      )}

      {lists.length === 0 && !showForm ? (
        <div className="page-center" style={{ marginTop: 40 }}>
          <span style={{ fontSize: 48 }}>👥</span>
          <p style={{ marginTop: 12, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
            Создай вишлист и позови друга —<br />вместе выбирать интереснее
          </p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setShowForm(true)}>
            Создать вишлист
          </button>
        </div>
      ) : (
        <div className="shared-list">
          {lists.map(sw => (
            <div key={sw.id} className="shared-list-item" onClick={() => navigate(`/shared/${sw.id}`)}>
              <div className="shared-list-item__info">
                <p className="shared-list-item__name">{sw.name}</p>
                <p className="shared-list-item__meta">
                  {sw.members.length} участн. · {sw.items.length} товаров
                </p>
              </div>
              <div className="shared-avatars">
                {sw.members.slice(0, 3).map(m => (
                  <div key={m.user_id} className="shared-avatar" title={m.first_name}>
                    {m.first_name[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Модалка выбора вещей из вишлиста ────────────────────────────────────────
function ItemPickerModal({
  myItems,
  alreadyIn,
  onAdd,
  onClose,
}: {
  myItems: WishlistItem[]
  alreadyIn: Set<string>
  onAdd: (product_id: string) => Promise<void>
  onClose: () => void
}) {
  const [adding, setAdding] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())

  const handleAdd = async (product_id: string) => {
    setAdding(product_id)
    try {
      await onAdd(product_id)
      setDone(prev => new Set([...prev, product_id]))
    } finally {
      setAdding(null)
    }
  }

  const available = myItems.filter(i => !alreadyIn.has(i.product_id))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Добавить вещи</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {available.length === 0 ? (
          <div className="modal-empty">
            <span style={{ fontSize: 36 }}>✅</span>
            <p>Все вещи из вишлиста уже добавлены</p>
          </div>
        ) : (
          <div className="picker-list">
            {available.map(item => {
              const isDone = done.has(item.product_id)
              const isAdding = adding === item.product_id
              return (
                <div key={item.product_id} className="picker-item">
                  <img src={item.image_url} alt={item.title} className="picker-item__img" />
                  <div className="picker-item__info">
                    {item.brand && <p className="picker-item__brand">{item.brand}</p>}
                    <p className="picker-item__title">{item.title}</p>
                    <p className="picker-item__price">{formatPrice(item.price)}</p>
                  </div>
                  <button
                    className={`picker-add-btn ${isDone ? 'done' : ''}`}
                    onClick={() => !isDone && handleAdd(item.product_id)}
                    disabled={isAdding}
                  >
                    {isDone ? '✓' : isAdding ? '…' : '＋'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Детальная страница совместного вишлиста ──────────────────────────────────
export function SharedWishlistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [sw, setSw] = useState<SharedWishlistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [myItems, setMyItems] = useState<WishlistItem[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [copied, setCopied] = useState(false)
  const [myUserId, setMyUserId] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([joinSharedWishlist(id), fetchWishlist(), fetchMe()])
      .then(([sharedData, myWishlist, me]) => {
        setSw(sharedData)
        setMyItems(myWishlist)
        setMyUserId(me.id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = async (product_id: string) => {
    if (!sw) return
    const updated = await addToSharedWishlist(sw.id, product_id)
    setSw(updated)
  }

  const handleRemove = async (product_id: string) => {
    if (!sw) return
    await removeFromSharedWishlist(sw.id, product_id)
    setSw(prev => prev
      ? { ...prev, items: prev.items.filter(i => i.product_id !== product_id) }
      : prev
    )
  }

  const handleCopyLink = () => {
    if (!sw) return
    navigator.clipboard.writeText(sw.invite_link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="page-center"><div className="spinner" /></div>
  if (!sw) return <div className="page-center"><p>Вишлист не найден</p></div>

  const alreadyIn = new Set(sw.items.map(i => i.product_id))
  const canAddMore = myItems.some(i => !alreadyIn.has(i.product_id))

  return (
    <div className="shared-detail-page">
      {/* Шапка */}
      <div className="shared-detail-header">
        <button className="btn-back" onClick={() => navigate('/shared')}>←</button>
        <div style={{ flex: 1 }}>
          <h2 className="shared-detail-title">{sw.name}</h2>
          <p className="shared-detail-meta">
            {sw.members.map(m => m.first_name).join(', ')}
          </p>
        </div>
        {/* Аватары участников */}
        <div className="shared-avatars">
          {sw.members.slice(0, 3).map(m => (
            <div key={m.user_id} className="shared-avatar">{m.first_name[0].toUpperCase()}</div>
          ))}
        </div>
      </div>

      {/* Кнопки действий */}
      <button className="btn-share" onClick={handleCopyLink}>
        {copied ? '✅ Ссылка скопирована!' : '🔗 Пригласить друга'}
      </button>

      {canAddMore && (
        <button className="btn-add-mine" onClick={() => setShowPicker(true)}>
          ＋ Добавить вещи из вишлиста
        </button>
      )}

      {/* Список товаров */}
      {sw.items.length === 0 ? (
        <div className="page-center" style={{ marginTop: 32 }}>
          <span style={{ fontSize: 44 }}>🛍️</span>
          <p style={{ marginTop: 12, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
            Пока пусто<br />Нажми «Добавить вещи» или пришли ссылку другу
          </p>
        </div>
      ) : (
        <div className="wishlist-list" style={{ marginTop: 16 }}>
          {sw.items.map(item => (
            <div key={`${item.product_id}-${item.added_by}`} className="wishlist-item">
              <img src={item.image_url} alt={item.title} className="wishlist-item__img" />
              <div className="wishlist-item__info">
                {item.brand && <p className="wishlist-item__brand">{item.brand}</p>}
                <p className="wishlist-item__title">{item.title}</p>
                <div className="wishlist-item__price-row">
                  <p className="wishlist-item__price">{formatPrice(item.price)}</p>
                  {item.price_old && (
                    <p className="wishlist-item__price-old">{formatPrice(item.price_old)}</p>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
                  добавил {item.added_by_name}
                </p>
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-buy"
                >
                  {marketplaceLabel(item.marketplace)} →
                </a>
              </div>
              {item.added_by === myUserId && (
                <button className="btn-remove" onClick={() => handleRemove(item.product_id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модалка выбора вещей */}
      {showPicker && (
        <ItemPickerModal
          myItems={myItems}
          alreadyIn={alreadyIn}
          onAdd={handleAdd}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

// ─── Страница создания (открывается по /shared/new) ───────────────────────────
export function SharedWishlistCreate() {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const sw = await createSharedWishlist(name.trim())
      navigate(`/shared/${sw.id}`, { replace: true })
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="shared-detail-page">
      <div className="shared-detail-header">
        <button className="btn-back" onClick={() => navigate('/wishlist')}>←</button>
        <h2 className="shared-detail-title">Новый совместный</h2>
      </div>
      <div className="shared-create-form" style={{ marginTop: 8 }}>
        <input
          className="shared-input"
          placeholder="Например: «Подарки на НГ»"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />
        <button
          className="btn-primary"
          onClick={handleCreate}
          disabled={creating || !name.trim()}
        >
          {creating ? 'Создаём...' : 'Создать вишлист'}
        </button>
      </div>
    </div>
  )
}
