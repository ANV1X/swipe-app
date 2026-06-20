import { useEffect, useState } from 'react'
import { Plus, Search, ChevronRight, ArrowLeft, Check } from 'lucide-react'
import {
  fetchCollections, fetchCollectionItems, createCollection,
  subscribeCollection, unsubscribeCollection,
  formatPrice, CollectionData, Product,
} from '../api/client'
import { useToast } from '../components/Toast'

function formatSubs(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' тыс. подписчиков'
  return n + ' подписчиков'
}

type DetailProps = { collection: CollectionData; onBack: () => void; onChange: (c: CollectionData) => void }

function CollectionDetail({ collection, onBack, onChange }: DetailProps) {
  const [items, setItems] = useState<Product[]>([])
  const [busy, setBusy] = useState(false)
  const { show, node } = useToast()

  useEffect(() => {
    fetchCollectionItems(collection.id).then(setItems).catch(console.error)
  }, [collection.id])

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

  const initials = collection.author_name.slice(0, 2).toUpperCase()

  return (
    <div className="page-bg">
      {node}
      <div className="page-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{collection.name}</div>
        </div>
        <div style={{ width: 36 }} />
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

      <div className="collection-grid">
        {items.map(item => (
          <div key={item.id} className="collection-grid-item">
            <img
              className="collection-grid-item__img"
              src={item.image_url || ''}
              alt={item.title}
            />
            <div className="collection-grid-item__price">{formatPrice(item.price)}</div>
          </div>
        ))}
      </div>
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
