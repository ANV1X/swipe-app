import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHistory, SwipeHistoryItem, formatPrice, marketplaceLabel } from '../api/client'

export default function History() {
  const navigate = useNavigate()
  const [items, setItems] = useState<SwipeHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'right' | 'left'>('all')

  useEffect(() => {
    setLoading(true)
    fetchHistory(filter === 'all' ? undefined : filter)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  const FILTERS = [
    { key: 'all',   label: 'Все' },
    { key: 'right', label: '❤️ Лайки' },
    { key: 'left',  label: '✕ Пропущено' },
  ]

  return (
    <div className="history-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/profile')}>←</button>
        <h1 className="page-title">История свайпов</h1>
      </div>

      <div className="filter-bar" style={{ paddingTop: 0 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key as any)}
          >{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="page-center">
          <span style={{ fontSize: 48 }}>🕐</span>
          <p style={{ color: 'var(--text2)', marginTop: 12 }}>История пуста</p>
        </div>
      ) : (
        <div className="history-list">
          {items.map((item, i) => (
            <div key={`${item.product_id}-${i}`} className="history-item">
              <div className={`history-dir ${item.direction === 'right' ? 'like' : 'nope'}`}>
                {item.direction === 'right' ? '❤️' : '✕'}
              </div>
              <img src={item.image_url} alt={item.title} className="history-item__img" />
              <div className="history-item__info">
                {item.brand && <p className="history-item__brand">{item.brand}</p>}
                <p className="history-item__title">{item.title}</p>
                <p className="history-item__price">{formatPrice(item.price)}</p>
                <p className="history-item__date">
                  {new Date(item.swiped_at).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              {item.direction === 'right' && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-buy"
                  style={{ fontSize: 11, padding: '6px 10px' }}
                >
                  Купить →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
