import { useState } from 'react'
import { Plus, ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CAPSULE_ITEMS = [
  { id: 1, image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=300', cat: 'Верх' },
  { id: 2, image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=300', cat: 'Верх' },
  { id: 3, image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=300', cat: 'Низ' },
  { id: 4, image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300', cat: 'Низ' },
  { id: 5, image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300', cat: 'Обувь' },
]

const CATEGORIES = [
  { name: 'Верх', current: 4, max: 5 },
  { name: 'Низ', current: 3, max: 4 },
  { name: 'Обувь', current: 2, max: 3 },
  { name: 'Верхняя одежда', current: 1, max: 2 },
]

const ADD_ITEMS = [
  { label: 'Белые кеды', note: 'добавить в капсулу' },
  { label: 'Бежевый тренч', note: 'добавить в капсулу' },
  { label: 'Чёрные брюки', note: 'добавить в капсулу' },
]

export default function CapsulePage() {
  const navigate = useNavigate()
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set())

  const totalItems = CATEGORIES.reduce((s, c) => s + c.current, 0)
  const totalMax = CATEGORIES.reduce((s, c) => s + c.max, 0)
  const progress = Math.round((totalItems / totalMax) * 100)

  function toggleAdd(idx: number) {
    setAddedItems(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <ArrowLeft size={18} />
          </button>
          <span className="page-title">Моя капсула</span>
        </div>
      </div>

      {/* Progress */}
      <div className="cap-card" style={{ margin: '0 16px 12px' }}>
        <div className="cap-section-label">Прогресс</div>
        <div className="cap-progress-bar">
          <div className="cap-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="cap-progress-pct">{progress}%</div>

        {/* Category rows */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{cat.name}</span>
              <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{cat.current}</span> / {cat.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Combinations */}
      <div className="cap-card" style={{ margin: '0 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="cap-section-label">Потенциально:</div>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>+12 новых сочетаний</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>38 образов</div>

        {/* Mini scrollable images */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 4 }}>
          {CAPSULE_ITEMS.map(item => (
            <img
              key={item.id}
              src={item.image}
              style={{ width: 60, height: 76, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: 'var(--surface2)' }}
              alt={item.cat}
            />
          ))}
        </div>
      </div>

      {/* Add items */}
      <div className="cap-card" style={{ margin: '0 16px 12px' }}>
        <div className="cap-section-label" style={{ marginBottom: 12 }}>Добавить:</div>
        {ADD_ITEMS.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: idx < ADD_ITEMS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, marginLeft: 4 }} />
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>
            <button
              onClick={() => toggleAdd(idx)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '1.5px solid var(--border)',
                background: addedItems.has(idx) ? 'var(--accent)' : 'none',
                color: addedItems.has(idx) ? '#fff' : 'var(--text2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              {addedItems.has(idx)
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <Plus size={14} />
              }
            </button>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="cap-card" style={{ margin: '0 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="cap-section-label" style={{ marginBottom: 0 }}>Рекомендуем</div>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            Все <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CAPSULE_ITEMS.slice(0, 3).map(item => (
            <div key={item.id} style={{ flexShrink: 0, width: 90, cursor: 'pointer' }}>
              <img src={item.image} style={{ width: 90, height: 110, borderRadius: 12, objectFit: 'cover', background: 'var(--surface2)' }} alt="" />
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{item.cat}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
