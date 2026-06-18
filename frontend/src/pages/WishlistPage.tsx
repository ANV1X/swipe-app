import { useState } from 'react'
import { Settings2, Trash2 } from 'lucide-react'

interface WishItem {
  id: number
  brand: string
  name: string
  store: string
  price: string
  oldPrice?: string
  discount?: string
  image: string
  url: string
}

const ITEMS: WishItem[] = [
  {
    id: 1,
    brand: 'Zara',
    name: 'Куртка оверсайз',
    store: 'Zara',
    price: '5 999 ₽',
    discount: '+15%',
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300',
    url: '#',
  },
  {
    id: 2,
    brand: 'New Balance',
    name: 'Кроссовки 530',
    store: 'New Balance',
    price: '9 990 ₽',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
    url: '#',
  },
  {
    id: 3,
    brand: 'Casio',
    name: 'Часы Casio Vintage',
    store: 'Casio',
    price: '3 490 ₽',
    discount: '-10%',
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=300',
    url: '#',
  },
  {
    id: 4,
    brand: 'Arny Praht',
    name: 'Сумка шоппер',
    store: 'Arny Praht',
    price: '2 180 ₽',
    oldPrice: '2 900 ₽',
    discount: '-25%',
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=300',
    url: '#',
  },
]

const CATEGORIES = ['Все', 'Одежда', 'Обувь', 'Аксессуары']

export default function WishlistPage() {
  const [activeCategory, setActiveCategory] = useState('Все')
  const [items, setItems] = useState(ITEMS)

  function removeItem(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="wishlist-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="page-title">Вишлист</span>
          <span style={{
            background: 'var(--accent)', color: '#fff',
            fontSize: 12, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20
          }}>{items.length}</span>
        </div>
        <button className="header-action-btn"><Settings2 size={20} /></button>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="wishlist-list">
        {items.map(item => (
          <div key={item.id} className="wishlist-item">
            <img src={item.image} className="wishlist-item__img" alt={item.name} />
            <div className="wishlist-item__info">
              <div className="wishlist-item__brand">{item.brand}</div>
              <div className="wishlist-item__name">{item.name}</div>
              <div className="wishlist-item__store">{item.store}</div>
              <div className="wishlist-item__price-row">
                <span className="wishlist-item__price">{item.price}</span>
                {item.oldPrice && <span className="wishlist-item__price-old">{item.oldPrice}</span>}
                {item.discount && (
                  <span className="wishlist-item__discount-badge">{item.discount}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => removeItem(item.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}
              >
                <Trash2 size={16} />
              </button>
              <a href={item.url} className="wishlist-buy-btn">Купить</a>
            </div>
          </div>
        ))}
      </div>

      <div className="wishlist-footer">
        <button className="btn-primary">Перейти к покупкам</button>
      </div>
    </div>
  )
}
