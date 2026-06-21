import { useEffect, useState } from 'react'
import { Bell, BellOff, ExternalLink, Trash2, ShoppingBag, Share2 } from 'lucide-react'
import {
  fetchWishlist, removeFromWishlist, updateWishlistNotify,
  formatPrice, marketplaceLabel, WishlistItem,
} from '../api/client'
import { useToast } from '../components/Toast'
import PriceChart from '../components/PriceChart'
import ShareProductSheet from '../components/ShareProductSheet'

const CATEGORIES = ['Все', 'Одежда', 'Обувь', 'Аксессуары']

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [category, setCategory] = useState('Все')
  const [loading, setLoading] = useState(true)
  const [shareItem, setShareItem] = useState<WishlistItem | null>(null)
  const { show, node } = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchWishlist()
      setItems(data)
    } catch (e) {
      console.error('load wishlist failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function removeItem(item: WishlistItem) {
    try {
      await removeFromWishlist(item.product_id)
      setItems(prev => prev.filter(i => i.id !== item.id))
      show('Удалено из вишлиста')
    } catch (e) {
      console.error('remove failed', e)
    }
  }

  async function toggleNotify(item: WishlistItem) {
    const newVal = !item.notify_price_drop
    try {
      await updateWishlistNotify(item.product_id, newVal)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, notify_price_drop: newVal } : i))
      show(newVal ? 'Уведомления о скидке включены' : 'Уведомления отключены')
    } catch (e) {
      console.error('toggle notify failed', e)
    }
  }

  function buyItem(item: WishlistItem) {
    window.open(item.external_url, '_blank', 'noopener,noreferrer')
  }

  const filtered = category === 'Все'
    ? items
    : items.filter(i => i.category === category)

  const totalOld = filtered.reduce((sum, i) => sum + (i.price_old || i.price), 0)
  const totalNew = filtered.reduce((sum, i) => sum + i.price, 0)
  const saved = totalOld - totalNew

  return (
    <div className="page-bg">
      {node}
      {shareItem && (
        <ShareProductSheet
          productId={shareItem.product_id}
          productTitle={shareItem.title}
          onClose={() => setShareItem(null)}
        />
      )}
      <div className="page-header">
        <div className="page-title">
          Вишлист
          {items.length > 0 && (
            <span style={{
              marginLeft: 8, background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 700, borderRadius: 10,
              padding: '2px 8px', verticalAlign: 'middle'
            }}>{items.length}</span>
          )}
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
      ) : filtered.length === 0 ? (
        <div className="page-center">
          <ShoppingBag size={48} color="var(--text3)" />
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Вишлист пуст</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Сохраняйте понравившиеся товары</div>
        </div>
      ) : (
        <>
          {saved > 0 && (
            <div style={{
              margin: '0 16px 12px',
              background: 'rgba(52,199,89,0.10)',
              border: '1px solid rgba(52,199,89,0.2)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>Экономия {formatPrice(saved)}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>по сравнению со старыми ценами</div>
              </div>
            </div>
          )}

          <div className="wishlist-list">
            {filtered.map(item => {
              const disc = item.price_old ? Math.round((1 - item.price / item.price_old) * 100) : null
              return (
                <div key={item.id} className="wishlist-item">
                  <img className="wishlist-item__img" src={item.image_url || ''} alt={item.title} />
                  <div className="wishlist-item__info">
                    <div className="wishlist-item__brand">{item.brand || marketplaceLabel(item.marketplace)}</div>
                    <div className="wishlist-item__name">{item.title}</div>
                    <div className="wishlist-item__store">{marketplaceLabel(item.marketplace)}</div>
                    <div className="wishlist-item__price-row">
                      <span className="wishlist-item__price">{formatPrice(item.price)}</span>
                      {item.price_old && <span className="wishlist-item__price-old">{formatPrice(item.price_old)}</span>}
                      {disc && <span className="wishlist-item__discount-badge">-{disc}%</span>}
                    </div>
                    <div
                      className={`wishlist-item__notify${item.notify_price_drop ? ' on' : ''}`}
                      onClick={() => toggleNotify(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.notify_price_drop
                        ? <><Bell size={11} /> Уведомить о скидке</>
                        : <><BellOff size={11} /> Без уведомлений</>
                      }
                    </div>
                    <PriceChart product_id={item.product_id} current_price={item.price} />
                  </div>
                  <button className="wishlist-remove-btn" onClick={() => removeItem(item)}>
                    <Trash2 size={13} />
                  </button>
                  <button
                    className="wishlist-remove-btn"
                    style={{ right: 46 }}
                    onClick={() => setShareItem(item)}
                  >
                    <Share2 size={13} />
                  </button>
                  <button className="wishlist-buy-btn" onClick={() => buyItem(item)}>
                    <ExternalLink size={12} />
                    Купить
                  </button>
                </div>
              )
            })}
          </div>

          {filtered.length > 0 && (
            <div className="wishlist-footer">
              <button className="btn-primary" onClick={() => buyItem(filtered[0])}>Перейти к покупкам</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
