import { useEffect, useState } from 'react'
import { Flame, Heart, Clock, ExternalLink } from 'lucide-react'
import { supabase, Product, getAnonId } from '../lib/supabase'
import { useToast } from '../components/Toast'

const CATEGORIES = ['Для вас', 'Одежда', 'Обувь', 'Аксессуары']

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽'
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Product[]>([])
  const [category, setCategory] = useState('Для вас')
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const { show, node } = useToast()
  const userId = getAnonId()

  useEffect(() => { loadDeals() }, [category])
  useEffect(() => { loadWishlist() }, [])

  async function loadDeals() {
    setLoading(true)
    let q = supabase.from('products').select('*').not('discount_pct', 'is', null).order('discount_pct', { ascending: false })
    if (category !== 'Для вас') q = q.eq('category', category)
    const { data } = await q
    setDeals(data || [])
    setLoading(false)
  }

  async function loadWishlist() {
    const { data } = await supabase.from('wishlist').select('product_id').eq('user_id', userId)
    setSaved(new Set(data?.map((d: any) => d.product_id) || []))
  }

  async function toggleSave(p: Product) {
    if (saved.has(p.id)) {
      await supabase.from('wishlist').delete().eq('user_id', userId).eq('product_id', p.id)
      setSaved(s => { const n = new Set(s); n.delete(p.id); return n })
      show('Удалено из вишлиста')
    } else {
      await supabase.from('wishlist').upsert({ user_id: userId, product_id: p.id })
      setSaved(s => new Set([...s, p.id]))
      show('Сохранено в вишлист')
    }
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
                  <Clock size={11} /> Осталось 6 ч
                </div>
              </div>
              <div className="deal-card__info">
                <div className="deal-card__name">{p.title}</div>
                <div className="deal-card__store">{p.brand || p.marketplace}</div>
                <div className="deal-card__price-row">
                  <span className="deal-card__price">{formatPrice(p.price)}</span>
                  {p.price_old && <span className="deal-card__price-old">{formatPrice(p.price_old)}</span>}
                </div>
                <button className="deal-card__buy-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
