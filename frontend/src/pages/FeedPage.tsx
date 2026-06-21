import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, ChevronDown, X, Heart, Share2 } from 'lucide-react'
import {
  fetchProducts, postSwipe, fetchWishlist, formatPrice,
  STYLE_OPTIONS, COLOR_OPTIONS, Product,
} from '../api/client'
import ShareProductSheet from '../components/ShareProductSheet'

const CATEGORIES = ['Все', 'Одежда', 'Обувь', 'Аксессуары']
const PRICE_PRESETS = [0, 3000, 8000, 20000]

const RATINGS: Record<string, string> = {}
function getRating(id: string) {
  if (!RATINGS[id]) RATINGS[id] = `4.${Math.floor(Math.random() * 4 + 5)}`
  return RATINGS[id]
}

export default function FeedPage() {
  const [cards, setCards] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [category, setCategory] = useState('Все')
  const [priceMax, setPriceMax] = useState(0)
  const [style, setStyle] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [, setWishlist] = useState<Set<string>>(new Set())
  const [swipeDir, setSwipeDir] = useState<'like' | 'nope' | null>(null)
  const [loading, setLoading] = useState(true)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const activeFiltersCount = (priceMax > 0 ? 1 : 0) + (style ? 1 : 0) + (color ? 1 : 0)

  useEffect(() => { loadProducts() }, [category, priceMax, style, color])
  useEffect(() => { loadWishlist() }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await fetchProducts({
        category: category !== 'Все' ? category : undefined,
        price_max: priceMax || undefined,
        style: style || undefined,
        color: color || undefined,
        exclude_swiped: true,
      })
      setCards(data)
      setCurrentIndex(0)
    } catch (e) {
      console.error('load products failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadWishlist() {
    try {
      const data = await fetchWishlist()
      setWishlist(new Set(data.map(d => d.product_id)))
    } catch (e) {
      console.error('load wishlist failed', e)
    }
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
    try {
      const result = await postSwipe(card.id, dir)
      if (result.added_to_wishlist) {
        setWishlist(s => new Set([...s, card.id]))
      }
    } catch (e) {
      console.error('swipe failed', e)
    }
  }

  function resetFilters() {
    setPriceMax(0)
    setStyle(null)
    setColor(null)
    setShowFilters(false)
  }

  if (!loading && !card && cards.length > 0) {
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
      {showShare && card && (
        <ShareProductSheet productId={card.id} productTitle={card.title} onClose={() => setShowShare(false)} />
      )}

      <div className="feed-topbar">
        <div className="feed-title">
          Лента <ChevronDown size={18} style={{ color: 'var(--text)' }} />
        </div>
        <button className="feed-filter-btn" onClick={() => setShowFilters(true)} style={{ position: 'relative' }}>
          <SlidersHorizontal size={18} />
          {activeFiltersCount > 0 && <span className="nav-badge" style={{ position: 'absolute', top: -4, right: -4 }}>{activeFiltersCount}</span>}
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
        {loading && cards.length === 0 ? (
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
                <button
                  onClick={(e) => { e.stopPropagation(); setShowShare(true) }}
                  style={{
                    position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.4)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
                  }}
                >
                  <Share2 size={15} />
                </button>
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

      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <h3 className="modal-title">Фильтры</h3>
              <button className="modal-close" onClick={() => setShowFilters(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Цена</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PRICE_PRESETS.map(p => (
                    <button
                      key={p}
                      className={`filter-chip${priceMax === p ? ' active' : ''}`}
                      onClick={() => setPriceMax(p)}
                    >
                      {p === 0 ? 'Любая цена' : `до ${formatPrice(p)}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Стиль</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    className={`filter-chip${!style ? ' active' : ''}`}
                    onClick={() => setStyle(null)}
                  >Любой</button>
                  {STYLE_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      className={`filter-chip${style === s.id ? ' active' : ''}`}
                      onClick={() => setStyle(s.id)}
                    >{s.emoji} {s.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Цвет</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {COLOR_OPTIONS.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setColor(color === c.id ? null : c.id)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', background: c.hex,
                        border: color === c.id ? '3px solid var(--accent)' : c.border ? '1px solid var(--border)' : '2px solid transparent',
                      }} />
                      <span style={{ fontSize: 10, color: 'var(--text2)' }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={resetFilters}
                  style={{
                    flex: 1, padding: 12, borderRadius: 12, border: 'none',
                    background: 'var(--surface2)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer',
                  }}
                >Сбросить</button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn-primary"
                  style={{ flex: 1, margin: 0 }}
                >Применить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
