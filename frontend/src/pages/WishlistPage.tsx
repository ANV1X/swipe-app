import { useEffect, useState } from 'react'
import { Bell, BellOff, ExternalLink, Trash2, ShoppingBag } from 'lucide-react'
import { supabase, Product, getAnonId } from '../lib/supabase'
import { useToast } from '../components/Toast'

const CATEGORIES = ['Все', 'Одежда', 'Обувь', 'Аксессуары']

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽'
}

type WishItem = {
  id: string
  product_id: string
  notify_price_drop: boolean
  products: Product
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishItem[]>([])
  const [category, setCategory] = useState('Все')
  const [loading, setLoading] = useState(true)
  const { show, node } = useToast()
  const userId = getAnonId()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setItems((data || []) as WishItem[])
    setLoading(false)
  }

  async function removeItem(id: string) {
    await supabase.from('wishlist').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    show('Удалено из вишлиста')
  }

  async function toggleNotify(item: WishItem) {
    const newVal = !item.notify_price_drop
    await supabase.from('wishlist').update({ notify_price_drop: newVal }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, notify_price_drop: newVal } : i))
    show(newVal ? 'Уведомления о скидке включены' : 'Уведомления отключены')
  }

  const filtered = category === 'Все'
    ? items
    : items.filter(i => i.products?.category === category)

  const totalOld = filtered.reduce((sum, i) => sum + (i.products?.price_old || i.products?.price || 0), 0)
  const totalNew = filtered.reduce((sum, i) => sum + (i.products?.price || 0), 0)
  const saved = totalOld - totalNew

  return (
    <div className="page-bg">
      {node}
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
              const p = item.products
              if (!p) return null
              const disc = p.price_old ? Math.round((1 - p.price / p.price_old) * 100) : null
              return (
                <div key={item.id} className="wishlist-item">
                  <img className="wishlist-item__img" src={p.image_url || ''} alt={p.title} />
                  <div className="wishlist-item__info">
                    <div className="wishlist-item__brand">{p.brand || p.marketplace}</div>
                    <div className="wishlist-item__name">{p.title}</div>
                    <div className="wishlist-item__store">{p.marketplace}</div>
                    <div className="wishlist-item__price-row">
                      <span className="wishlist-item__price">{formatPrice(p.price)}</span>
                      {p.price_old && <span className="wishlist-item__price-old">{formatPrice(p.price_old)}</span>}
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
                  </div>
                  <button className="wishlist-remove-btn" onClick={() => removeItem(item.id)}>
                    <Trash2 size={13} />
                  </button>
                  <button className="wishlist-buy-btn">
                    <ExternalLink size={12} />
                    Купить
                  </button>
                </div>
              )
            })}
          </div>

          {filtered.length > 0 && (
            <div className="wishlist-footer">
              <button className="btn-primary">Перейти к покупкам</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
