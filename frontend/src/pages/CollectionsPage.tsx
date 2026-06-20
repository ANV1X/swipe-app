import { useEffect, useState } from 'react'
import { Plus, Search, ChevronRight, ArrowLeft, Check, X } from 'lucide-react'
import {
  fetchCollections, fetchCollectionItems, createCollection,
  subscribeCollection, unsubscribeCollection,
  addCollectionItem, removeCollectionItem, fetchWishlist, fetchMe,
  formatPrice, CollectionData, Product, WishlistItem,
} from '../api/client'
import { useToast } from '../components/Toast'

function formatSubs(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' тыс. подписчиков'
  return n + ' подписчиков'
}

type DetailProps = { collection: CollectionData; onBack: () => void; onChange: (c: CollectionData) => void }

function AddItemModal({ collectionId, existingIds, onClose, onAdded }: {
  collectionId: string; existingIds: Set<string>; onClose: () => void; onAdded: (items: Product[]) => void
}) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const { show, node } = useToast()

  useEffect(() => { fetchWishlist().then(setWishlist).catch(console.error) }, [])

  async function addItem(productId: string) {
    setBusyId(productId)
    try {
      const items = await addCollectionItem(collectionId, productId)
      onAdded(items)
      show('Добавлено в коллекцию')
    } catch (e) {
      console.error('add collection item failed', e)
    } finally {
      setBusyId(null)
    }
  }

  const available = wishlist.filter(w => !existingIds.has(w.product_id))

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {node}
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Добавить товар</h3>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '4px 16px 20px' }}>
          {available.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
              {wishlist.length === 0
                ? 'Сначала сохраните что-то в вишлист — оттуда можно добавлять товары в коллекцию'
                : 'Все товары из вашего вишлиста уже в этой коллекции'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {available.map(w => (
                <div
                  key={w.product_id}
                  onClick={() => !busyId && addItem(w.product_id)}
                  style={{
                    background: 'var(--surface2)', borderRadius: 14, overflow: 'hidden',
                    cursor: 'pointer', opacity: busyId === w.product_id ? 0.5 : 1,
                  }}
                >
                  <img src={w.image_url || ''} alt={w.title} style={{
                    width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block'
                  }} />
                  <div style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                    {formatPrice(w.price)}
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

function CollectionDetail({ collection, onBack, onChange }: DetailProps) {
  const [items, setItems] = useState<Product[]>([])
  const [busy, setBusy] = useState(false)
  const [myUserId, setMyUserId] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const { show, node } = useToast()

  useEffect(() => {
    fetchCollectionItems(collection.id).then(setItems).catch(console.error)
    fetchMe().then(me => setMyUserId(me.id)).catch(console.error)
  }, [collection.id])

  const isAuthor = !!myUserId && myUserId === collection.author_id

  async function handleSubscribe() {
    setBusy(true)
    try {
      const updated = collection.is_subscribed
        ? await unsubscribeCollection(collection.id)
        : await subscribeCollection(collection.id)
      onChange(updated)
      show(updated.is_subscribed ? 'Подписались на коллекцию!' : 'Отписались от коллекции')
    } catch (e) {
      console.error('subscribe toggle failed', e)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveItem(productId: string) {
    try {
      const updatedItems = await removeCollectionItem(collection.id, productId)
      setItems(updatedItems)
      show('Товар удалён из коллекции')
    } catch (e) {
      console.error('remove collection item failed', e)
    }
  }

  const initials = collection.author_name.slice(0, 2).toUpperCase()

  return (
    <div className="page-bg">
      {node}
      {showAddItem && (
        <AddItemModal
          collectionId={collection.id}
          existingIds={new Set(items.map(i => i.id))}
          onClose={() => setShowAddItem(false)}
          onAdded={setItems}
        />
      )}
      <div className="page-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{collection.name}</div>
        </div>
        {isAuthor ? (
          <button className="header-action-btn" onClick={() => setShowAddItem(true)}><Plus size={20} /></button>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>

      <div className="collection-detail-hero">
        <div className="collection-detail-avatar">{initials}</div>
        <div>
          <div className="collection-detail-author">by {collection.author_name}</div>
          <div className="collection-detail-name">{formatSubs(collection.subscribers_count)}</div>
        </div>
      </div>

      <div className="collection-detail-count">{items.length} товаров</div>

      <button
        className={`collection-subscribe-btn${collection.is_subscribed ? ' subscribed' : ''}`}
        onClick={handleSubscribe}
        disabled={busy}
      >
        {collection.is_subscribed
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Check size={16} /> Вы подписаны</span>
          : 'Подписаться'}
      </button>

      {items.length === 0 ? (
        <div className="page-center" style={{ minHeight: '20vh' }}>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>
            {isAuthor ? 'Добавьте первый товар в коллекцию' : 'В коллекции пока нет товаров'}
          </div>
        </div>
      ) : (
        <div className="collection-grid">
          {items.map(item => (
            <div key={item.id} className="collection-grid-item" style={{ position: 'relative' }}>
              <img
                className="collection-grid-item__img"
                src={item.image_url || ''}
                alt={item.title}
              />
              <div className="collection-grid-item__price">{formatPrice(item.price)}</div>
              {isAuthor && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  style={{
                    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const TABS: { label: string; key: 'popular' | 'new' | 'subscribed' }[] = [
  { label: 'Популярные', key: 'popular' },
  { label: 'Новинки', key: 'new' },
  { label: 'Подписки', key: 'subscribed' },
]

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionData[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'popular' | 'new' | 'subscribed'>('popular')
  const [selected, setSelected] = useState<CollectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const { show, node } = useToast()

  useEffect(() => { load() }, [tab])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchCollections(tab)
      setCollections(data)
    } catch (e) {
      console.error('load collections failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const c = await createCollection(newName.trim())
      setCollections(prev => [c, ...prev])
      setNewName('')
      setShowCreate(false)
      show('Коллекция создана')
    } catch (e) {
      console.error('create collection failed', e)
    } finally {
      setCreating(false)
    }
  }

  function updateOne(c: CollectionData) {
    setSelected(c)
    setCollections(prev => prev.map(x => x.id === c.id ? c : x))
  }

  if (selected) return <CollectionDetail collection={selected} onBack={() => setSelected(null)} onChange={updateOne} />

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.author_name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="page-bg">
      {node}
      <div className="page-header">
        <div className="page-title">Коллекции</div>
        <button className="header-action-btn" onClick={() => setShowCreate(true)}><Plus size={22} /></button>
      </div>

      <div className="search-bar-wrap">
        <div className="search-bar">
          <Search size={16} color="var(--text3)" />
          <input
            placeholder="Поиск коллекций"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="collections-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`collections-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="page-center">
          <div style={{ fontSize: 15, color: 'var(--text2)' }}>
            {tab === 'subscribed' ? 'Вы пока ни на что не подписаны' : 'Коллекций не найдено'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <div className="collection-list">
            {filtered.map(c => (
              <div key={c.id} className="collection-item" onClick={() => setSelected(c)}>
                <img
                  className="collection-item__img"
                  src={c.cover_image || ''}
                  alt={c.name}
                />
                <div className="collection-item__info">
                  <div className="collection-item__name">{c.name}</div>
                  <div className="collection-item__subs">{formatSubs(c.subscribers_count)}</div>
                </div>
                <ChevronRight size={18} className="collection-item__arrow" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <h3 className="modal-title">Новая коллекция</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="shared-create-form">
              <input
                className="shared-input"
                placeholder="Например: «Образы на лето»"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <button className="btn-primary" onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? 'Создаём...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
