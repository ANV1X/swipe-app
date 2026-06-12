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
      <div className="feed-topbar">
        <div className="filter-bar">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`filter-btn ${category === c.key ? 'active' : ''}`}
              onClick={() => setCategory(c.key)}
            >{c.label}</button>
          ))}
        </div>
        <button
          className={`filter-icon-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >⚙️</button>
      </div>

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
                >{p.label}</button>
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
                >{g.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card-stack">
        {loading && (
          <div className="empty-state">
            <div className="spinner" />
            <p>Загружаем для тебя...</p>
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
            <span style={{ fontSize: 48 }}>🎉</span>
            <p>Всё просмотрено!</p>
            <button className="btn-primary" onClick={load}>Показать ещё</button>
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

      {!loading && products.length > 0 && (
        <div className="action-buttons">
          <button className="action-btn action-btn--nope" onClick={() => swipeManual('left')}>✕</button>
          <button className="action-btn action-btn--like" onClick={() => swipeManual('right')}>♥</button>
        </div>
      )}

      {lastDir && (
        <div className={`swipe-hint swipe-hint--${lastDir}`}>
          {lastDir === 'right' ? '❤️ Добавлено!' : '✕ Пропущено'}
        </div>
      )}
    </div>
  )
}
