import { useState } from 'react'
import { Heart, Star } from 'lucide-react'

interface Deal {
  id: number
  name: string
  store: string
  price: string
  oldPrice: string
  discount: string
  rating: string
  ratingCount: string
  image: string
}

const DEALS: Deal[] = [
  {
    id: 1,
    name: 'Куртка-бомбер',
    store: 'Mango',
    price: '6 990 ₽',
    oldPrice: '9 990 ₽',
    discount: '-30%',
    rating: '4.8',
    ratingCount: '2 341',
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 2,
    name: 'Кеды Converse Chuck 70',
    store: 'Lamoda',
    price: '7 690 ₽',
    oldPrice: '9 600 ₽',
    discount: '-20%',
    rating: '4.7',
    ratingCount: '1 120',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 3,
    name: 'Пальто оверсайз',
    store: 'Zara',
    price: '8 990 ₽',
    oldPrice: '11 990 ₽',
    discount: '-25%',
    rating: '4.9',
    ratingCount: '876',
    image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]

const TABS = ['Для вас', 'Одежда', 'Обувь', 'Аксессуары']

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState('Для вас')
  const [saved, setSaved] = useState<Set<number>>(new Set())

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="page-header">
        <span className="page-title">Горячие скидки 🔥</span>
      </div>

      <div className="filter-bar">
        {TABS.map(tab => (
          <button key={tab} className={`filter-chip${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px 24px' }}>
        {DEALS.map(deal => (
          <div key={deal.id} style={{ background: 'var(--surface)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            {/* Image */}
            <div style={{ position: 'relative', width: '100%', height: 260, background: 'var(--surface2)', overflow: 'hidden' }}>
              <img src={deal.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={deal.name} />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'var(--red)', color: '#fff',
                fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
              }}>{deal.discount}</div>
              <button
                onClick={() => setSaved(prev => { const n = new Set(prev); n.has(deal.id) ? n.delete(deal.id) : n.add(deal.id); return n })}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 38, height: 38, borderRadius: '50%', border: 'none',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: saved.has(deal.id) ? 'var(--red)' : 'var(--text2)',
                }}
              >
                <Heart size={18} fill={saved.has(deal.id) ? 'var(--red)' : 'none'} />
              </button>

              {/* Store badge bottom-left */}
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '4px 10px',
                fontSize: 11, fontWeight: 700, color: 'var(--text)',
              }}>{deal.store}</div>
            </div>

            {/* Info */}
            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{deal.name}</div>

              {/* Rating row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                <Star size={13} fill="#FFD60A" color="#FFD60A" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{deal.rating}</span>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>({deal.ratingCount} отзывов)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{deal.price}</span>
                  <span style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'line-through' }}>{deal.oldPrice}</span>
                </div>
                <button style={{
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '10px 20px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>Купить</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
