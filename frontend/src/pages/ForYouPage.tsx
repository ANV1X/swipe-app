import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const COLORS = [
  { name: 'Чёрный', hex: '#1A1A1A' },
  { name: 'Белый', hex: '#F5F5F5', border: true },
  { name: 'Бежевый', hex: '#C9B89A' },
  { name: 'Хаки', hex: '#8B8B6B' },
]

const STYLES = ['Oversize', 'Minimal', 'Casual', 'Smart']

const RECS = [
  { id: 1, name: 'Тренч бежевый', price: '6 490 ₽', image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 2, name: 'Кроссовки белые', price: '4 990 ₽', image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 3, name: 'Джинсы прямые', price: '3 990 ₽', image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 4, name: 'Пальто серое', price: '9 990 ₽', image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400' },
]

export default function ForYouPage() {
  const navigate = useNavigate()
  const [activeStyle, setActiveStyle] = useState('Minimal')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <ArrowLeft size={18} />
          </button>
          <span className="page-title">Для тебя ✨</span>
        </div>
      </div>

      <div style={{ padding: '0 16px 4px', fontSize: 13, color: 'var(--text2)', marginBottom: 2 }}>
        Мы изучили твой вкус
      </div>

      {/* Favourite colors */}
      <div className="cap-card" style={{ margin: '0 16px 12px' }}>
        <div className="cap-section-label" style={{ marginBottom: 12 }}>Любимые цвета</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {COLORS.map(c => (
            <div key={c.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: c.hex,
                border: c.border ? '1.5px solid var(--border)' : '1.5px solid transparent',
              }} />
              <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 500 }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Style preference */}
      <div className="cap-card" style={{ margin: '0 16px 12px' }}>
        <div className="cap-section-label" style={{ marginBottom: 12 }}>Стиль</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STYLES.map(s => (
            <button
              key={s}
              onClick={() => setActiveStyle(s)}
              className={`filter-chip${activeStyle === s ? ' active' : ''}`}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Подборка / Match */}
      <div className="cap-card" style={{ margin: '0 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="cap-section-label" style={{ marginBottom: 4 }}>Подборка сегодня</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>32 новых товара</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>Совпадение вкуса</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>96%</div>
          </div>
        </div>
      </div>

      {/* Recommendations grid */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Рекомендуем</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RECS.map(rec => (
            <div key={rec.id} style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
              <img
                src={rec.image}
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block', background: 'var(--surface2)' }}
                alt={rec.name}
              />
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{rec.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{rec.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
