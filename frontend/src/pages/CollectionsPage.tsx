import { useState } from 'react'
import { Search, Plus, ChevronRight, ArrowLeft } from 'lucide-react'

interface Collection {
  id: number
  name: string
  author: string
  subscribers: string
  image: string
}

const COLLECTIONS: Collection[] = [
  {
    id: 1,
    name: 'Minimal до 5000 ₽',
    author: 'by Anna',
    subscribers: '432 подписчика',
    image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 2,
    name: 'Лето 2026',
    author: 'by Style.ru',
    subscribers: '691 подписчик',
    image: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 3,
    name: 'Лучшие кроссы',
    author: 'by Nike Fan',
    subscribers: '1 204 подписчика',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 4,
    name: 'Офисный гардероб',
    author: 'by WorkStyle',
    subscribers: '743 подписчика',
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 5,
    name: 'Базовый гардероб',
    author: 'by Minimal',
    subscribers: '832 подписчика',
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
]

const COLLECTION_ITEMS = [
  { id: 1, price: '2 990 ₽', image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 2, price: '2 480 ₽', image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 3, price: '3 990 ₽', image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 4, price: '2 190 ₽', image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 5, price: '3 480 ₽', image: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 6, price: '1 990 ₽', image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300' },
]

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<'popular' | 'new' | 'subs'>('popular')
  const [detail, setDetail] = useState<Collection | null>(null)
  const [subscribed, setSubscribed] = useState<Set<number>>(new Set())

  if (detail) {
    return (
      <div className="collections-page main-content" style={{ paddingBottom: 90 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px 12px' }}>
          <button
            onClick={() => setDetail(null)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{detail.name}</span>
        </div>

        <div className="collection-detail-hero">
          <img src={detail.image} className="collection-detail-avatar" alt="" />
          <div>
            <div className="collection-detail-name">{detail.name}</div>
            <div className="collection-detail-author">{detail.author} · {detail.subscribers}</div>
          </div>
        </div>

        <button
          className={`collection-subscribe-btn ${subscribed.has(detail.id) ? 'subscribed' : ''}`}
          onClick={() => setSubscribed(prev => {
            const next = new Set(prev)
            next.has(detail.id) ? next.delete(detail.id) : next.add(detail.id)
            return next
          })}
        >
          {subscribed.has(detail.id) ? 'Подписан' : 'Подписаться'}
        </button>

        <div className="collection-detail-count">15 товаров</div>

        <div className="collection-grid">
          {COLLECTION_ITEMS.map(item => (
            <div key={item.id} className="collection-grid-item">
              <img src={item.image} className="collection-grid-item__img" alt="" />
              <div className="collection-grid-item__price">{item.price}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="collections-page">
      <div className="page-header">
        <span className="page-title">Коллекции</span>
        <button className="header-action-btn"><Plus size={22} /></button>
      </div>

      <div className="search-bar-wrap">
        <div className="search-bar">
          <Search size={16} color="var(--text3)" />
          <input placeholder="Поиск коллекций" />
        </div>
      </div>

      <div className="collections-tabs">
        <button className={`collections-tab ${activeTab === 'popular' ? 'active' : ''}`} onClick={() => setActiveTab('popular')}>Популярные</button>
        <button className={`collections-tab ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>Новые</button>
        <button className={`collections-tab ${activeTab === 'subs' ? 'active' : ''}`} onClick={() => setActiveTab('subs')}>Подписки</button>
      </div>

      <div className="collection-list">
        {COLLECTIONS.map(col => (
          <div key={col.id} className="collection-item" onClick={() => setDetail(col)}>
            <img src={col.image} className="collection-item__img" alt="" />
            <div className="collection-item__info">
              <div className="collection-item__name">{col.name}</div>
              <div className="collection-item__subs">{col.subscribers}</div>
            </div>
            <ChevronRight size={18} className="collection-item__arrow" />
          </div>
        ))}
      </div>
    </div>
  )
}
