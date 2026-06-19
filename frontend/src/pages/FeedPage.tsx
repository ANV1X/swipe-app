import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, ChevronDown, X, Heart } from 'lucide-react'
import { supabase, Product, getAnonId } from '../lib/supabase'

const CATEGORIES = ['Все', 'Одежда', 'Обувь', 'Аксессуары']

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽'
}

const RATINGS: Record<string, string> = {}
function getRating(id: string) {
  if (!RATINGS[id]) RATINGS[id] = `4.${Math.floor(Math.random() * 4 + 5)}`
  return RATINGS[id]
}

export default function FeedPage() {
  const [cards, setCards] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [category, setCategory] = useState('Все')
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [swipeDir, setSwipeDir] = useState<'like' | 'nope' | null>(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadProducts() }, [category])
  useEffect(() => { loadWishlist() }, [])

  async function loadProducts() {
    let q = supabase.from('products').select('*').order('created_at', { ascending: false })
    if (category !== 'Все') q = q.eq('category', category)
    const { data } = await q
    setCards(data || [])
    setCurrentIndex(0)
  }

  async function loadWishlist() {
    const userId = getAnonId()
    const { data } = await supabase.from('wishlist').select('product_id').eq('user_id', userId)
    setWishlist(new Set(data?.map(d => d.product_id) || []))
  }

  const card = cards[currentIndex]

  function onPointerDown(e: React.PointerEvent) {
    isDragging.current = true
    startX.current = e.clientX
    currentX.current = 0
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId)
      cardRef.current.style.transition = 'none'
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    currentX.current = dx
    const rotation = dx * 0.07
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${rotation}deg)`
    }
    if (dx > 40) setSwipeDir('like')
    else if (dx < -40) setSwipeDir('nope')
    else setSwipeDir(null)
  }

  function onPointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = currentX.current
    if (dx > 80) flyOut('like')
    else if (dx < -80) flyOut('nope')
    else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)'
        cardRef.current.style.transform = 'translateX(0) rotate(0deg)'
      }
      setSwipeDir(null)
    }
  }

  function flyOut(dir: 'like' | 'nope') {
    if (!cardRef.current || !card) return
    const x = dir === 'like' ? 520 : -520
    cardRef.current.style.transition = 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)'
    cardRef.current.style.transform = `translateX(${x}px) rotate(${dir === 'like' ? 20 : -20}deg)`
    recordSwipe(dir)
    setTimeout(() => {
      setSwipeDir(null)
      setCurrentIndex(i => i + 1)
      if (cardRef.current) cardRef.current.style.transform = ''
    }, 360)
  }

  async function recordSwipe(dir: 'like' | 'nope') {
    if (!card) return
    const userId = getAnonId()
    await supabase.from('swipes').insert({ user_id: userId, product_id: card.id, direction: dir })
    if (dir === 'like') {
      await supabase.from('wishlist').upsert({ user_id: userId, product_id: card.id, notify_price_drop: true })
      setWishlist(s => new Set([...s, card.id]))
    }
  }

  if (!card && cards.length > 0) {
    return (
      <div className="feed-page">
        <div className="page-center" style={{ flex: 1 }}>
          <div style={{ fontSize: 48 }}>✨</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Всё просмотрено!</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.5 }}>
            Мы подберём новые товары под ваш вкус
          </div>
          <button className="btn-primary" style={{ width: 'auto', padding: '14px 32px', marginTop: 8 }} onClick={loadProducts}>
            Обновить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="feed-page">
      <div className="feed-topbar">
        <div className="feed-title">
          Лента <ChevronDown size={18} style={{ color: 'var(--text)' }} />
        </div>
        <button className="feed-filter-btn">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`filter-chip${category === c ? ' active' : ''}`}
            onClick={() => setCategory(c)}
          >{c}</button>
        ))}
      </div>

      <div className="card-stack">
        {cards.length === 0 ? (
          <div className="page-center"><div className="spinner" /></div>
        ) : card ? (
          <>
            {cards[currentIndex + 1] && (
              <div
                className="swipe-card"
                style={{ transform: 'scale(0.93) translateY(14px)', zIndex: 0, pointerEvents: 'none', opacity: 0.75 }}
              >
                <div className="card-image-wrap">
                  <img src={cards[currentIndex + 1].image_url || ''} alt="" />
                </div>
              </div>
            )}
            <div
              ref={cardRef}
              className="swipe-card"
              style={{ zIndex: 1 }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="card-image-wrap">
                <img src={card.image_url || ''} alt={card.title} />
                <div className="card-mp-badge">{card.marketplace}</div>
                {card.discount_pct && (
                  <div className="card-discount-badge">-{card.discount_pct}%</div>
                )}
                {swipeDir === 'like' && <div className="swipe-indicator-like">ЛАЙК</div>}
                {swipeDir === 'nope' && <div className="swipe-indicator-nope">НЕЕЕ</div>}
                <div className="card-overlay">
                  <div className="card-overlay-brand">{card.brand || card.marketplace}</div>
                  <div className="card-overlay-title">{card.title}</div>
                  <div className="card-overlay-price-row">
                    <div className="card-overlay-price">{formatPrice(card.price)}</div>
                    {card.price_old && <div className="card-overlay-price-old">{formatPrice(card.price_old)}</div>}
                  </div>
                  <div className="card-overlay-shop-row">
                    <div className="card-overlay-shop">
                      <div className="card-overlay-shop-dot" />
                      <div className="card-overlay-shop-name">{card.marketplace}</div>
                    </div>
                    <div className="card-overlay-rating">★ {getRating(card.id)}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="action-buttons">
        <button className="action-btn action-btn--nope" onClick={() => flyOut('nope')}>
          <X size={26} />
        </button>
        <button
          className="action-btn action-btn--like"
          onClick={() => flyOut('like')}
        >
          <Heart size={28} fill="white" />
        </button>
      </div>
    </div>
  )
}
