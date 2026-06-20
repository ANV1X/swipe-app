import { useEffect, useState } from 'react'
import { Flame, Heart, Clock, ExternalLink } from 'lucide-react'
import {
  fetchDeals, fetchWishlist, addToWishlist, removeFromWishlist,
  formatPrice, Deal,
} from '../api/client'
import { useToast } from '../components/Toast'

const CATEGORIES = ['Для вас', 'Одежда', 'Обувь', 'Аксессуары']

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [category, setCategory] = useState('Для вас')
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const { show, node } = useToast()

  useEffect(() => { loadDeals() }, [category])
  useEffect(() => { loadWishlist() }, [])

  async function loadDeals() {
    setLoading(true)
    try {
      const data = await fetchDeals({
        for_you: category === 'Для вас',
        category: category !== 'Для вас' ? category : undefined,
      })
      setDeals(data)
    } catch (e) {
      console.error('load deals failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadWishlist() {
    try {
      const data = await fetchWishlist()
      setSaved(new Set(data.map(d => d.product_id)))
    } catch (e) {
      console.error('load wishlist failed', e)
    }
  }

  async function toggleSave(p: Deal) {
    try {
      if (saved.has(p.id)) {
        await removeFromWishlist(p.id)
        setSaved(s => { const n = new Set(s); n.delete(p.id); return n })
        show('Удалено из вишлиста')
      } else {
        await addToWishlist(p.id)
        setSaved(s => new Set([...s, p.id]))
        show('Сохранено в вишлист')
      }
    } catch (e) {
      console.error('toggle save failed', e)
    }
  }

  function buyDeal(p: Deal) {
    window.open(p.external_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page-bg">
      {node}
      <div className="page-header">
        <div className="page-title">
          Горячие скидки <Flame size={22} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--orange)' }} />
        </div>
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

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : deals.length === 0 ? (
        <div className="page-center">
          <Flame size={48} color="var(--text3)" />
          <div style={{ fontSize: 15, color: 'var(--text2)' }}>Скидок нет</div>
        </div>
      ) : (
        <div className="deals-list">
          {deals.map(p => (
            <div key={p.id} className="deal-card">
              <div className="deal-card__img-wrap">
                <img className="deal-card__img" src={p.image_url || ''} alt={p.title} />
                {p.discount_pct && (
                  <div className="deal-discount-badge">-{p.discount_pct}%</div>
                )}
                <button
                  className={`deal-fav-btn${saved.has(p.id) ? ' saved' : ''}`}
                  onClick={() => toggleSave(p)}
                >
                  <Heart size={16} fill={saved.has(p.id) ? 'currentColor' : 'none'} />
                </button>
                <div className="deal-timer-badge">
                  <Clock size={11} /> Горячая скидка
                </div>
              </div>
              <div className="deal-card__info">
                <div className="deal-card__name">{p.title}</div>
                <div className="deal-card__store">{p.brand || p.marketplace}</div>
                <div className="deal-card__price-row">
                  <span className="deal-card__price">{formatPrice(p.price)}</span>
                  {p.price_old && <span className="deal-card__price-old">{formatPrice(p.price_old)}</span>}
                </div>
                <button
                  className="deal-card__buy-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => buyDeal(p)}
                >
                  <ExternalLink size={16} /> Купить за {formatPrice(p.price)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
