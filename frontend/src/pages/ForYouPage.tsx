import { useEffect, useState } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { supabase, Product } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'

const COLORS = [
  { name: 'Чёрный', color: '#1C1C1E' },
  { name: 'Белый', color: '#F5F5F0', border: true },
  { name: 'Бежевый', color: '#D4C4A8' },
  { name: 'Хаки', color: '#8B8560' },
  { name: 'Синий', color: '#2C5F8A' },
]

const STYLES = ['Oversize', 'Minimal', 'Casual', 'Smart']

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽'
}

export default function ForYouPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set(['Minimal']))
  const [activeColors, setActiveColors] = useState<Set<string>>(new Set(['Чёрный', 'Бежевый']))
  const navigate = useNavigate()
  const { show, node } = useToast()

  useEffect(() => {
    supabase.from('products').select('*').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setProducts(data || []))
  }, [])

  function toggleStyle(s: string) {
    setActiveStyles(prev => {
      const n = new Set(prev)
      if (n.has(s)) n.delete(s); else n.add(s)
      return n
    })
    show('Предпочтения обновлены')
  }

  function toggleColor(name: string) {
    setActiveColors(prev => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name); else n.add(name)
      return n
    })
  }

  const matchCount = 32
  const matchPct = 96

  return (
    <div className="page-bg">
      {node}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700 }}>Для тебя ✨</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '2px 0 0' }}>
        <div style={{ fontSize: 13, color: 'var(--text2)', padding: '0 20px 12px' }}>
          Мы изучили твой вкус
        </div>
      </div>

      {/* Colors */}
      <div className="foryou-section">
        <div className="foryou-section-label">Любимые цвета</div>
        <div className="foryou-colors-row">
          {COLORS.map(c => (
            <div key={c.name} className="foryou-color-item" onClick={() => toggleColor(c.name)}>
              <div
                className="foryou-color-swatch"
                style={{
                  background: c.color,
                  borderColor: activeColors.has(c.name) ? 'var(--accent)' : 'rgba(0,0,0,0.08)',
                  borderWidth: activeColors.has(c.name) ? 3 : 2,
                  transform: activeColors.has(c.name) ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.15s'
                }}
              />
              <div className="foryou-color-name">{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Styles */}
      <div className="foryou-section">
        <div className="foryou-section-label">Стиль</div>
        <div className="foryou-styles-row">
          {STYLES.map(s => (
            <button
              key={s}
              className={`foryou-style-chip${activeStyles.has(s) ? ' active' : ''}`}
              onClick={() => toggleStyle(s)}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Match */}
      <div className="foryou-match-card">
        <div className="foryou-match-left">
          <div className="foryou-match-title">Подборка сегодня</div>
          <div className="foryou-match-count">{matchCount} новых товара</div>
          <div className="foryou-match-sub">Совпадение вкуса</div>
        </div>
        <div className="foryou-match-pct">{matchPct}%</div>
      </div>

      {/* Recommendations */}
      <div className="foryou-recs-section">
        <div className="foryou-recs-title">Рекомендуем</div>
        <div className="foryou-recs-grid">
          {products.map(p => (
            <div key={p.id} className="foryou-rec-card">
              <img src={p.image_url || ''} alt={p.title} />
              <div className="foryou-rec-info">
                <div className="foryou-rec-brand">{p.brand || p.marketplace}</div>
                <div className="foryou-rec-name">{p.title}</div>
                <div className="foryou-rec-price">{formatPrice(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
