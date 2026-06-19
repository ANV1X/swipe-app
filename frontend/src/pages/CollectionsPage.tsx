import { useEffect, useState } from 'react'
import { Plus, Search, ChevronRight, ArrowLeft, Check } from 'lucide-react'
import { supabase, Collection, Product } from '../lib/supabase'
import { useToast } from '../components/Toast'

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽'
}

function formatSubs(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' тыс. подписчиков'
  return n + ' подписчиков'
}

type DetailProps = { collection: Collection; onBack: () => void }

function CollectionDetail({ collection, onBack }: DetailProps) {
  const [items, setItems] = useState<Product[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const { show, node } = useToast()

  useEffect(() => {
    supabase
      .from('collection_items')
      .select('products(*)')
      .eq('collection_id', collection.id)
      .then(({ data }) => {
        setItems((data || []).map((d: any) => d.products).filter(Boolean))
      })
  }, [collection.id])

  function handleSubscribe() {
    setSubscribed(s => !s)
    show(subscribed ? 'Отписались от коллекции' : 'Подписались на коллекцию!')
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
        className={`collection-subscribe-btn${subscribed ? ' subscribed' : ''}`}
        onClick={handleSubscribe}
      >
        {subscribed ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Check size={16} /> Вы подписаны</span> : 'Подписаться'}
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

const TABS = ['Популярные', 'Новинки', 'Подписки']

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('Популярные')
  const [selected, setSelected] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.from('collections').select('*').order('subscribers_count', { ascending: false })
      .then(({ data }) => {
        setCollections(data || [])
        setLoading(false)
      })
  }, [])

  if (selected) return <CollectionDetail collection={selected} onBack={() => setSelected(null)} />

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.author_name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="page-bg">
      <div className="page-header">
        <div className="page-title">Коллекции</div>
        <button className="header-action-btn"><Plus size={22} /></button>
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
          <button key={t} className={`collections-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
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
    </div>
  )
}
