import { useEffect, useState, useCallback, useRef } from 'react'
import TinderCard from 'react-tinder-card'
import SwipeCard from '../components/SwipeCard'
import ChannelBanner from '../components/ChannelBanner'
import { fetchProducts, postSwipe, Product } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'
import type { OnboardingPrefs } from './Onboarding'

type Dir = 'left' | 'right' | 'up' | 'down'

interface Props { prefs: OnboardingPrefs }

const BANNER_KEY = 'channel_banner_dismissed'

export default function Feed({ prefs }: Props) {
  const { haptic } = useTelegram()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMax, setPriceMax] = useState(prefs.priceMax)
  const [gender, setGender] = useState(prefs.gender)
  const [lastDir, setLastDir] = useState<'left' | 'right' | null>(null)
  const [showBanner, setShowBanner] = useState(
    !localStorage.getItem(BANNER_KEY)
  )
  const lastDirTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRefs = useRef<Map<string, any>>(new Map())

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
      console.error(e)
      setError('Не удалось загрузить товары')
    } finally {
      setLoading(false)
    }
  }, [category, priceMax, gender])

  useEffect(() => { load() }, [load])

  const showHint = (dir: 'left' | 'right') => {
    setLastDir(dir)
    if (lastDirTimer.current) clearTimeout(lastDirTimer.current)
    lastDirTimer.current = setTimeout(() => setLastDir(null), 1200)
  }

  const onSwipe = async (dir: Dir, product: Product) => {
    if (dir !== 'left' && dir !== 'right') return
    haptic(dir === 'right' ? 'medium' : 'light')
    showHint(dir)
    try { await postSwipe(product.id, dir) } catch {}
    setProducts(prev => {
      const remaining = prev.filter(p => p.id !== product.id)
      if (remaining.length < 3) load()
      return remaining
    })
  }

  const swipeTop = (dir: 'left' | 'right') => {
    const top = products[products.length - 1]
    if (!top) return
    const ref = cardRefs.current.get(top.id)
    if (ref) ref.swipe(dir)
    else onSwipe(dir, top)
  }

  const dismissBanner = () => {
    localStorage.setItem(BANNER_KEY, '1')
    setShowBanner(false)
  }

  const CATEGORIES = [
    { key: '', label: 'Все' },
    { key: 'clothes', label: 'Одежда' },
    { key: 'shoes', label: 'Обувь' },
    { key: 'accessories', label: 'Аксессуары' },
  ]

  const PRICES = [
    { value: 2000,  label: 'до 2К' },
    { value: 5000,  label: 'до 5К' },
    { value: 15000, label: 'до 15К' },
    { value: 99999, label: 'Все' },
  ]

  const GENDERS = [
    { value: 'female', label: 'Она' },
    { value: 'male',   label: 'Он' },
    { value: 'unisex', label: 'Все' },
  ]

  return (
    <div className="feed-page">
      {/* Топбар */}
      <div className="feed-topbar">
        <span className="feed-title">Лента 🔥</span>
        <button
          className={`filter-icon-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >⚙️</button>
      </div>

      {/* Фильтры категорий */}
      <div className="filter-bar">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`filter-btn ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}
          >{c.label}</button>
        ))}
      </div>

      {/* Расширенные фильтры */}
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

      {/* Баннер канала */}
      {showBanner && <ChannelBanner onDismiss={dismissBanner} />}

      {/* Стек карточек */}
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
            <span style={{ fontSize: 52 }}>🎉</span>
            <p>Всё просмотрено!</p>
            <button className="btn-primary" onClick={load}>Показать ещё</button>
          </div>
        )}
        {products.map(product => (
          <TinderCard
            key={product.id}
            ref={(el: any) => {
              if (el) cardRefs.current.set(product.id, el)
              else cardRefs.current.delete(product.id)
            }}
            onSwipe={dir => onSwipe(dir as Dir, product)}
            preventSwipe={['up', 'down']}
            swipeRequirementType="position"
            swipeThreshold={80}
          >
            <SwipeCard product={product} />
          </TinderCard>
        ))}
      </div>

      {/* Кнопки */}
      {!loading && products.length > 0 && (
        <div className="action-buttons">
          <button className="action-btn action-btn--nope" onClick={() => swipeTop('left')}>✕</button>
          <button className="action-btn action-btn--like" onClick={() => swipeTop('right')}>♥</button>
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
