import { useState, useRef } from 'react'
import { SlidersHorizontal, ChevronDown, X, Heart, Bookmark, Star } from 'lucide-react'

interface Product {
  id: number
  brand: string
  name: string
  price: string
  oldPrice?: string
  image: string
  marketplace: string
  marketplaceLogo: string
  rating: string
  discount?: string
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    brand: 'COS',
    name: 'Кардиган из шерсти',
    price: '8 990 ₽',
    image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600',
    marketplace: 'Lamoda',
    marketplaceLogo: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&w=32',
    rating: '4.0',
  },
  {
    id: 2,
    brand: 'Zara',
    name: 'Прямые джинсы',
    price: '5 990 ₽',
    oldPrice: '7 990 ₽',
    image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600',
    marketplace: 'Wildberries',
    marketplaceLogo: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&w=32',
    discount: '-25%',
    rating: '4.5',
  },
  {
    id: 3,
    brand: 'Massimo Dutti',
    name: 'Пальто оверсайз',
    price: '14 990 ₽',
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=600',
    marketplace: 'Ozon',
    marketplaceLogo: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&w=32',
    rating: '4.8',
  },
  {
    id: 4,
    brand: 'New Balance',
    name: 'Кроссовки 530',
    price: '9 990 ₽',
    oldPrice: '12 500 ₽',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600',
    marketplace: 'Lamoda',
    marketplaceLogo: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=32',
    discount: '-20%',
    rating: '4.7',
  },
]

const CATEGORIES = ['Все', 'Одежда', 'Обувь', 'Аксессуары']

const MP_COLORS: Record<string, string> = {
  Lamoda: '#FF6B35',
  Wildberries: '#CB11AB',
  Ozon: '#005BFF',
  'Яндекс Маркет': '#FFCC00',
}

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState('Все')
  const [dragging, setDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [swipedItems, setSwipedItems] = useState<Set<number>>(new Set())
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const dragStart = useRef<number | null>(null)

  const visible = PRODUCTS.filter(p => !swipedItems.has(p.id))
  const topProduct = visible[0]

  function handlePointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientX
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || dragStart.current === null) return
    setDragX(e.clientX - dragStart.current)
  }

  function handlePointerUp() {
    if (!topProduct) return
    if (Math.abs(dragX) > 90) {
      swipe(dragX > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
    }
    setDragging(false)
    dragStart.current = null
  }

  function swipe(dir: 'left' | 'right') {
    if (!topProduct) return
    if (dir === 'right') setWishlist(prev => new Set([...prev, topProduct.id]))
    setSwipedItems(prev => new Set([...prev, topProduct.id]))
    setDragX(0)
  }

  const rotate = dragging ? dragX * 0.05 : 0
  const likeOpacity = Math.max(0, Math.min(1, dragX / 100))
  const nopeOpacity = Math.max(0, Math.min(1, -dragX / 100))

  return (
    <div className="feed-page">
      <div className="feed-topbar">
        <div className="feed-title">
          Лента
          <ChevronDown size={20} strokeWidth={2} />
        </div>
        <button className="feed-filter-btn">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className="card-stack">
        {visible.length === 0 && (
          <div className="page-center">
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 17 }}>Всё просмотрено!</p>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Зайди позже — будет новое</p>
          </div>
        )}

        {/* Background cards */}
        {visible.slice(1, 3).reverse().map((product, i) => (
          <div
            key={product.id}
            className="swipe-card"
            style={{
              transform: `scale(${0.94 + i * 0.03}) translateY(${(1 - i) * 12}px)`,
              zIndex: i,
            }}
          >
            <div className="card-image-wrap">
              <img src={product.image} alt={product.name} />
            </div>
          </div>
        ))}

        {/* Top card */}
        {topProduct && (
          <div
            className="swipe-card"
            style={{
              transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
              transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(.23,1,.32,1)',
              zIndex: 10,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {likeOpacity > 0.05 && (
              <div className="swipe-indicator-like" style={{ opacity: likeOpacity }}>НРАВИТСЯ</div>
            )}
            {nopeOpacity > 0.05 && (
              <div className="swipe-indicator-nope" style={{ opacity: nopeOpacity }}>МИМО</div>
            )}

            <div className="card-image-wrap">
              <img src={topProduct.image} alt={topProduct.name} />

              {/* Bookmark top-right */}
              <button
                className={`card-bookmark-btn${wishlist.has(topProduct.id) ? ' saved' : ''}`}
                onClick={e => {
                  e.stopPropagation()
                  setWishlist(prev => {
                    const next = new Set(prev)
                    next.has(topProduct.id) ? next.delete(topProduct.id) : next.add(topProduct.id)
                    return next
                  })
                }}
              >
                <Bookmark size={17} fill={wishlist.has(topProduct.id) ? 'var(--accent)' : 'none'} strokeWidth={2} />
              </button>

              {/* Discount badge top-right (when no bookmark overlap) */}
              {topProduct.discount && (
                <div className="card-discount-badge">{topProduct.discount}</div>
              )}

              {/* Bottom overlay: shop + product info + rating */}
              <div className="card-overlay">
                {/* Brand / name / price row */}
                <div className="card-overlay-brand">{topProduct.brand}</div>
                <div className="card-overlay-title">{topProduct.name}</div>
                <div className="card-overlay-price-row">
                  <span className="card-overlay-price">{topProduct.price}</span>
                  {topProduct.oldPrice && (
                    <span className="card-overlay-price-old">{topProduct.oldPrice}</span>
                  )}
                </div>

                {/* Shop row: icon + name (left) and rating (right) */}
                <div className="card-overlay-shop-row">
                  <div className="card-overlay-shop">
                    <div
                      className="card-overlay-shop-dot"
                      style={{ background: MP_COLORS[topProduct.marketplace] ?? '#666' }}
                    />
                    <span className="card-overlay-shop-name">{topProduct.marketplace}</span>
                  </div>
                  <div className="card-overlay-rating">
                    <Star size={11} fill="#FFD60A" color="#FFD60A" />
                    <span>{topProduct.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {visible.length > 0 && (
        <div className="action-buttons">
          <button className="action-btn action-btn--nope" onClick={() => swipe('left')}>
            <X size={24} strokeWidth={2.5} />
          </button>
          <button className="action-btn action-btn--like" onClick={() => swipe('right')}>
            <Heart size={26} fill="white" strokeWidth={0} />
          </button>
        </div>
      )}
    </div>
  )
}
