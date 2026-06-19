import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Shirt, Footprints, Watch, Layers } from 'lucide-react'
import { supabase, Product, getAnonId } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽'
}

const CAPSULE_CATS = [
  { key: 'Верх', icon: Shirt, target: 5, current: 4 },
  { key: 'Низ', icon: Layers, target: 4, current: 3 },
  { key: 'Обувь', icon: Footprints, target: 3, current: 2 },
  { key: 'Верхняя одежда', icon: Shirt, target: 2, current: 1 },
]

export default function CapsulePage() {
  const [items, setItems] = useState<Product[]>([])
  const navigate = useNavigate()
  const { show, node } = useToast()

  useEffect(() => {
    const userId = getAnonId()
    supabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', userId)
      .limit(8)
      .then(({ data }) => {
        setItems((data || []).map((d: any) => d.products).filter(Boolean))
      })
  }, [])

  const total = CAPSULE_CATS.reduce((sum, c) => sum + c.current, 0)
  const totalTarget = CAPSULE_CATS.reduce((sum, c) => sum + c.target, 0)
  const progress = Math.round((total / totalTarget) * 100)
  const combos = Math.max(total * 3, 38)

  return (
    <div className="page-bg">
      {node}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700 }}>Моя капсула</div>
        <div style={{ width: 36 }} />
      </div>

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
          {CAPSULE_CATS.map(cat => {
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

        {/* Mini images */}
        {items.length > 0 && (
          <div className="capsule-mini-imgs" style={{ marginTop: 12 }}>
            {items.map(p => (
              <img key={p.id} className="capsule-mini-img" src={p.image_url || ''} alt={p.title} />
            ))}
          </div>
        )}

        {/* Add items */}
        <div className="capsule-add-section">
          <div className="capsule-add-title">Добавить:</div>
          {[
            { label: 'Белые кеды', icon: Footprints },
            { label: 'Бежевый тренч', icon: Shirt },
            { label: 'Чёрные брюки', icon: Layers },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="capsule-add-item" onClick={() => show(`${item.label} добавлено в список желаний`)}>
                <div className="capsule-add-icon">
                  <Icon size={14} />
                </div>
                <span className="capsule-add-label">{item.label}</span>
                <button className="capsule-add-plus">+</button>
              </div>
            )
          })}
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, padding: '10px 0 0', cursor: 'pointer' }}>
            +12 новых сочетаний →
          </div>
        </div>
      </div>
    </div>
  )
}
