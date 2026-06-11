import { useEffect, useState, useCallback } from 'react'
import { fetchDeals, addToWishlistById, Deal, formatPrice, marketplaceLabel } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'

const CATEGORIES = [
  { key: '', label: 'Все' },
  { key: 'clothes', label: 'Одежда' },
  { key: 'shoes', label: 'Обувь' },
  { key: 'accessories', label: 'Аксессуары' },
]

const MP_COLORS: Record<string, string> = {
  wb: '#CB11AB', ozon: '#005BFF', lamoda: '#1A1A1A',
}

export default function Deals() {
  const { haptic } = useTelegram()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'for_you'>('all')
  const [category, setCategory] = useState('')
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDeals({
        for_you: tab === 'for_you',
        category: category || undefined,
      })
      setDeals(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tab, category])

  useEffect(() => { load() }, [load])

  const handleSave = async (deal: Deal) => {
    if (saved.has(deal.id)) return
    setSaving(deal.id)
    haptic('medium')
    try {
      await addToWishlistById(deal.id)
      setSaved(prev => new Set([...prev, deal.id]))
    } catch (e) { console.error(e) }
    finally { setSaving(null) }
  }

  return (
    <div className="deals-page">
      {/* Шапка */}
      <div className="page-header">
        <h1 className="page-title">Горячие скидки 🔥</h1>
      </div>

      {/* Табы для тебя / все */}
      <div className="deals-tabs">
        <button
          className={`deals-tab ${tab === 'for_you' ? 'active' : ''}`}
          onClick={() => setTab('for_you')}
        >
          ✨ Для тебя
        </button>
        <button
          className={`deals-tab ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          Все скидки
        </button>
      </div>

      {/* Категории */}
      <div className="filter-bar" style={{ paddingTop: 0 }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`filter-btn ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}
          >{c.label}</button>
        ))}
      </div>

      {/* Контент */}
      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : deals.length === 0 ? (
        <div className="page-center">
          <span style={{ fontSize: 48 }}>😔</span>
          <p style={{ color: 'var(--text2)', textAlign: 'center' }}>
            {tab === 'for_you'
              ? 'Свайпни побольше вещей — подберём скидки под твой вкус'
              : 'Скидок пока нет'}
          </p>
        </div>
      ) : (
        <div className="deals-list">
          {deals.map(deal => {
            const isSaved = saved.has(deal.id)
            const isSaving = saving === deal.id
            const mpColor = MP_COLORS[deal.marketplace] ?? '#333'

            return (
              <div key={deal.id} className="deal-card">
                {/* Фото */}
                <div className="deal-card__img-wrap">
                  <img src={deal.image_url} alt={deal.title} className="deal-card__img" />

                  {/* Скидка */}
                  <div className="deal-badge">−{deal.discount_pct}%</div>

                  {/* Маркетплейс */}
                  <div className="deal-mp-badge" style={{ color: mpColor }}>
                    {marketplaceLabel(deal.marketplace)}
                  </div>

                  {/* Кнопка сохранить */}
                  <button
                    className={`deal-save-btn ${isSaved ? 'saved' : ''}`}
                    onClick={() => handleSave(deal)}
                    disabled={isSaving}
                  >
                    {isSaved ? '❤️' : isSaving ? '…' : '🤍'}
                  </button>
                </div>

                {/* Инфо */}
                <div className="deal-card__info">
                  <div className="deal-card__top">
                    {deal.brand && <p className="deal-card__brand">{deal.brand}</p>}
                    <p className="deal-card__title">{deal.title}</p>
                  </div>

                  <div className="deal-card__bottom">
                    <div className="deal-card__prices">
                      <span className="deal-card__price">{formatPrice(deal.price)}</span>
                      {deal.price_old && (
                        <span className="deal-card__price-old">{formatPrice(deal.price_old)}</span>
                      )}
                    </div>

                    <a
                      href={deal.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="deal-buy-btn"
                    >
                      Купить →
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
