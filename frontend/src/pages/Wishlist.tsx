import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchWishlist, removeFromWishlist, WishlistItem,
  fetchSharedWishlists, SharedWishlistData,
  formatPrice, marketplaceLabel
} from '../api/client'
import PriceChart, { setPriceChartInitData } from '../components/PriceChart'
import { useTelegram } from '../hooks/useTelegram'

type WishlistTab = 'personal' | 'shared'
type CatTab = 'all' | 'clothes' | 'shoes' | 'accessories'

export default function Wishlist() {
  const { initData } = useTelegram()
  const navigate = useNavigate()

  const [tab, setTab] = useState<WishlistTab>('personal')
  const [catTab, setCatTab] = useState<CatTab>('all')
  const [items, setItems] = useState<WishlistItem[]>([])
  const [sharedLists, setSharedLists] = useState<SharedWishlistData[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setPriceChartInitData(initData)
    try {
      const [personal, shared] = await Promise.all([
        fetchWishlist(),
        fetchSharedWishlists(),
      ])
      setItems(personal)
      setSharedLists(shared)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [initData])

  useEffect(() => { loadAll() }, [loadAll])

  const handleRemove = async (product_id: string) => {
    setRemoving(product_id)
    try {
      await removeFromWishlist(product_id)
      setItems(prev => prev.filter(i => i.product_id !== product_id))
    } catch (e) { console.error(e) }
    finally { setRemoving(null) }
  }

  const filtered = catTab === 'all' ? items : items.filter(i => i.category === catTab)
  const totalValue = filtered.reduce((s, i) => s + i.price, 0)

  const CAT_TABS = [
    { key: 'all', label: 'Все' },
    { key: 'clothes', label: 'Одежда' },
    { key: 'shoes', label: 'Обувь' },
    { key: 'accessories', label: 'Аксессуары' },
  ]

  if (loading) return <div className="page-center"><div className="spinner" /></div>

  return (
    <div className="wishlist-page">
      {/* Шапка */}
      <div className="wishlist-header">
        <div>
          <h1 className="page-title">Вишлист</h1>
          {tab === 'personal' && (
            <p className="wishlist-count">{items.length} товаров</p>
          )}
        </div>
        {tab === 'personal' && items.length > 0 && (
          <div className="wishlist-total-wrap">
            <p className="wishlist-total-label">Итого</p>
            <p className="wishlist-total">{formatPrice(totalValue)}</p>
          </div>
        )}
      </div>

      {/* Главные табы: Мой вишлист / Совместный */}
      <div className="wishlist-main-tabs">
        <button
          className={`wishlist-main-tab ${tab === 'personal' ? 'active' : ''}`}
          onClick={() => setTab('personal')}
        >
          🤍 Мой вишлист
          {items.length > 0 && (
            <span className="tab-count">{items.length}</span>
          )}
        </button>
        <button
          className={`wishlist-main-tab ${tab === 'shared' ? 'active' : ''}`}
          onClick={() => setTab('shared')}
        >
          👥 Совместный
          {sharedLists.length > 0 && (
            <span className="tab-count">{sharedLists.length}</span>
          )}
        </button>
      </div>

      {/* ─── Личный вишлист ─── */}
      {tab === 'personal' && (
        <>
          {items.length === 0 ? (
            <div className="page-center">
              <span style={{ fontSize: 52 }}>🤍</span>
              <p style={{ color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
                Вишлист пуст<br />Свайпай вправо — вещи появятся здесь
              </p>
            </div>
          ) : (
            <>
              <div className="wishlist-tabs">
                {CAT_TABS.map(t => (
                  <button
                    key={t.key}
                    className={`wishlist-tab ${catTab === t.key ? 'active' : ''}`}
                    onClick={() => setCatTab(t.key as CatTab)}
                  >{t.label}</button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="page-center" style={{ minHeight: '30vh' }}>
                  <p style={{ color: 'var(--text2)' }}>В этой категории пусто</p>
                </div>
              ) : (
                <div className="wishlist-list">
                  {filtered.map(item => (
                    <div
                      key={item.product_id}
                      className={`wishlist-item ${removing === item.product_id ? 'removing' : ''}`}
                    >
                      <img src={item.image_url} alt={item.title} className="wishlist-item__img" />
                      <div className="wishlist-item__info">
                        {item.brand && <p className="wishlist-item__brand">{item.brand}</p>}
                        <p className="wishlist-item__title">{item.title}</p>
                        <div className="wishlist-item__price-row">
                          <p className="wishlist-item__price">{formatPrice(item.price)}</p>
                          {item.price_old && (
                            <p className="wishlist-item__price-old">{formatPrice(item.price_old)}</p>
                          )}
                        </div>
                        <PriceChart product_id={item.product_id} current_price={item.price} />
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-buy"
                          style={{ marginTop: 8, display: 'inline-block' }}
                        >
                          Купить на {marketplaceLabel(item.marketplace)} →
                        </a>
                      </div>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemove(item.product_id)}
                        disabled={removing === item.product_id}
                      >
                        {removing === item.product_id ? '…' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Совместные вишлисты ─── */}
      {tab === 'shared' && (
        <div className="shared-in-wishlist">
          <button
            className="btn-create-shared"
            onClick={() => navigate('/shared/new')}
          >
            ＋ Создать совместный вишлист
          </button>

          {sharedLists.length === 0 ? (
            <div className="page-center" style={{ marginTop: 32 }}>
              <span style={{ fontSize: 48 }}>👥</span>
              <p style={{ marginTop: 12, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
                Создай вишлист и позови друга —<br />вместе выбирать интереснее
              </p>
            </div>
          ) : (
            <div className="shared-list" style={{ marginTop: 12 }}>
              {sharedLists.map(sw => (
                <div
                  key={sw.id}
                  className="shared-list-item"
                  onClick={() => navigate(`/shared/${sw.id}`)}
                >
                  <div className="shared-list-item__info">
                    <p className="shared-list-item__name">{sw.name}</p>
                    <p className="shared-list-item__meta">
                      {sw.members.length} участн. · {sw.items.length} товаров
                    </p>
                  </div>
                  <div className="shared-avatars">
                    {sw.members.slice(0, 3).map(m => (
                      <div key={m.user_id} className="shared-avatar">
                        {m.first_name[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
