import { useEffect, useState } from 'react'
import { ArrowLeft, Shirt, Footprints, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { fetchWishlist, WishlistItem } from '../api/client'

const TARGETS: Record<string, { icon: typeof Shirt; target: number }> = {
  'Одежда': { icon: Shirt, target: 6 },
  'Обувь': { icon: Footprints, target: 3 },
  'Аксессуары': { icon: Layers, target: 3 },
}

export default function CapsulePage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { show, node } = useToast()

  useEffect(() => {
    fetchWishlist()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const counts: Record<string, number> = {}
  for (const item of items) counts[item.category] = (counts[item.category] || 0) + 1

  const cats = Object.entries(TARGETS).map(([key, def]) => ({
    key, icon: def.icon, target: def.target, current: Math.min(counts[key] || 0, def.target),
  }))

  const total = cats.reduce((sum, c) => sum + c.current, 0)
  const totalTarget = cats.reduce((sum, c) => sum + c.target, 0)
  const progress = totalTarget > 0 ? Math.round((total / totalTarget) * 100) : 0
  const combos = Math.max(total * 3, items.length)

  return (
    <div className="page-bg">
      {node}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700 }}>Моя капсула</div>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Progress */}
          <div className="capsule-progress-card">
            <div className="capsule-progress-label">Прогресс</div>
            <div className="capsule-progress-bar">
              <div className="capsule-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="capsule-progress-pct">{progress}%</div>
          </div>

          {/* Category rows */}
          <div className="capsule-rows">
            {cats.map(cat => {
              const Icon = cat.icon
              return (
                <div key={cat.key} className="capsule-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color="var(--accent)" />
                    </div>
                    <span className="capsule-row__label">{cat.key}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="capsule-row__fraction">{cat.current} / {cat.target}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Combos stat */}
          <div className="capsule-stat-row">
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Потенциально:</div>
            <div className="capsule-stat-number">{combos} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text2)' }}>образов</span></div>
          </div>

          {/* Mini images — реальные вещи из вишлиста */}
          {items.length > 0 && (
            <div className="capsule-mini-imgs" style={{ marginTop: 12 }}>
              {items.slice(0, 8).map(p => (
                <img key={p.id} className="capsule-mini-img" src={p.image_url || ''} alt={p.title} />
              ))}
            </div>
          )}

          {/* Add items — переход к ленте, чтобы найти вещи под капсулу */}
          <div className="capsule-add-section">
            <div className="capsule-add-title">Чего не хватает:</div>
            {cats.filter(c => c.current < c.target).map(cat => {
              const Icon = cat.icon
              return (
                <div
                  key={cat.key}
                  className="capsule-add-item"
                  onClick={() => { show(`Ищем «${cat.key}» в ленте`); navigate('/') }}
                >
                  <div className="capsule-add-icon">
                    <Icon size={14} />
                  </div>
                  <span className="capsule-add-label">{cat.key} ({cat.target - cat.current} не хватает)</span>
                  <button className="capsule-add-plus">+</button>
                </div>
              )
            })}
            {cats.every(c => c.current >= c.target) && (
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, padding: '6px 0' }}>
                Капсула укомплектована! 🎉
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
