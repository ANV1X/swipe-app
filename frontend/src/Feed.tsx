import { useEffect, useState, useCallback } from 'react'
import SwipeStack from '../components/SwipeStack'
import SwipeCard from '../components/SwipeCard'
import { fetchProducts, postSwipe, Product } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'
import type { OnboardingPrefs } from './Onboarding'

interface Props { prefs: OnboardingPrefs }

export default function Feed({ prefs }: Props) {
  const { haptic } = useTelegram()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMax, setPriceMax] = useState(prefs.priceMax)
  const [gender, setGender] = useState(prefs.gender)
  const [lastDir, setLastDir] = useState<'left' | 'right' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProducts({
        category: category as any || undefined,
        price_max: priceMax < 99999 ? priceMax : undefined,
        gender: gender !== 'unisex' ? gender : undefined,
      })
      setProducts(data)
    } catch (e) {
      setError('Не удалось загрузить товары')
    } finally {
      setLoading(false)
    }
  }, [category, priceMax, gender])

  useEffect(() => { load() }, [load])

  const onSwipe = useCallback(async (dir: 'left' | 'right', product: Product) => {
    haptic(dir === 'right' ? 'medium' : 'light')
    setLastDir(dir)
    setTimeout(() => setLastDir(null), 1200)
    try { await postSwipe(product.id, dir) } catch {}
    setProducts(prev => {
      const remaining = prev.filter(p => p.id !== product.id)
      if (remaining.length < 3) load()
      return remaining
    })
  }, [haptic, load])

  const swipeManual = (dir: 'left' | 'right') => {
    const top = products[products.length - 1]
    if (top) onSwipe(dir, top)
  }

  const CATEGORIES = [
    { key: '', label: 'Всё' },
    { key: 'clothes', label: 'Одежда' },
    { key: 'shoes', label: 'Обувь' },
    { key: 'accessories', label: 'Аксессуары' },
  ]

  const PRICES = [
    { value: 2000, label: 'до 2К' },
    { value: 5000, label: 'до 5К' },
    { value: 15000, label: 'до 15К' },
    { value: 99999, label: 'Все' },
  ]

  const GENDERS = [
    { value: 'female', label: 'Она' },
    { value: 'male', label: 'Он' },
    { value: 'unisex', label: 'Все' },
  ]

  return (
    <div className="feed-page">
      {/* Топбар с горизонтальным скроллом категорий и кнопкой фильтра */}
      <div className="feed-topbar">
        <div className="filter-bar">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`filter-btn ${category === c.key ? 'active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        
        {/* Кнопка настроек фильтра в стиле iOS */}
        <button
          className={`filter-icon-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </div>

      {/* Выпадающая панель расширенных фильтров */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <p className="filter-group-label">Цена</p>
            <div className="filter-chips">
              {PRICES.map(p => (
                <button
                  key={p.value}
                  className={`filter-chip ${priceMax === p.value ? 'active' : ''}`}
                  onClick={() => setPriceMax(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <p className="filter-group-label">Для кого</p>
            <div className="filter-chips">
              {GENDERS.map(g => (
                <button
                  key={g.value}
                  className={`filter-chip ${gender === g.value ? 'active' : ''}`}
                  onClick={() => setGender(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Область со стеком карточек */}
      <div className="card-stack">
        {loading && (
          <div className="empty-state">
            <div className="spinner" />
            <p>Подбираем лучшее...</p>
          </div>
        )}
        {!loading && error && (
          <div className="empty-state">
            <p>{error}</p>
            <button className="btn-primary" onClick={load}>Попробовать снова</button>
          </div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="empty-state">
            <span style={{ fontSize: 48, display: 'block', marginBottom: '12px' }}>🎉</span>
            <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>Всё просмотрено!</p>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '16px' }}>Измени параметры фильтра или зайди позже</p>
            <button className="btn-primary" onClick={load}>Показать еще</button>
          </div>
        )}
        {!loading && products.length > 0 && (
          <SwipeStack
            items={products}
            onSwipe={onSwipe}
            renderItem={(product) => <SwipeCard product={product} />}
          />
        )}
      </div>

      {/* Экшен-кнопки управления карточкой */}
      {!loading && products.length > 0 && (
        <div className="action-buttons">
          {/* Кнопка Скип (Дислайк) */}
          <button 
            className="action-btn action-btn--nope" 
            onClick={() => swipeManual('left')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Кнопка Лайк */}
          <button 
            className="action-btn action-btn--like" 
            onClick={() => swipeManual('right')}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Мягкие всплывающие подсказки при свайпах */}
      {lastDir && (
        <div className={`swipe-hint swipe-hint--${lastDir}`}>
          {lastDir === 'right' ? '❤️ Хочу!' : '✕ Мимо'}
        </div>
      )}
    </div>
  )
}