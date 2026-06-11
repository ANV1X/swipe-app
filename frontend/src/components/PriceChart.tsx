import { useEffect, useState } from 'react'
import { formatPrice } from '../api/client'

interface Point { date: string; price: number }
interface PriceHistoryData {
  product_id: string
  current_price: number
  min_price: number
  max_price: number
  points: Point[]
}

interface Props {
  product_id: string
  current_price: number
}

const BASE_URL = 'http://localhost:8000'
let _initData = ''
export function setPriceChartInitData(d: string) { _initData = d }

export default function PriceChart({ product_id, current_price }: Props) {
  const [data, setData] = useState<PriceHistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const load = async () => {
    if (data) { setOpen(v => !v); return }
    setLoading(true)
    setOpen(true)
    try {
      const res = await fetch(`${BASE_URL}/wishlist/${product_id}/price-history`, {
        headers: { 'Content-Type': 'application/json', 'X-Init-Data': _initData }
      })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  // SVG мини-график
  const renderChart = (points: Point[], min: number, max: number) => {
    if (points.length < 2) return null
    const W = 280, H = 64, pad = 8
    const range = max - min || 1
    const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (W - pad * 2))
    const ys = points.map(p => H - pad - ((p.price - min) / range) * (H - pad * 2))

    const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
    const area = `${path} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`

    const isDown = points[points.length - 1].price <= points[0].price
    const color = isDown ? '#00B894' : '#E17055'

    // Текущая цена — последняя точка
    const cx = xs[xs.length - 1]
    const cy = ys[ys.length - 1]

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`g_${product_id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#g_${product_id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r="4" fill={color} />
      </svg>
    )
  }

  if (!open) {
    return (
      <button className="price-chart-toggle" onClick={load}>
        📈 График цены
      </button>
    )
  }

  return (
    <div className="price-chart-wrap">
      <button className="price-chart-toggle active" onClick={() => setOpen(false)}>
        📈 График цены ▲
      </button>
      {loading && <div className="price-chart-loading"><div className="spinner-sm" /></div>}
      {data && !loading && (
        <div className="price-chart-body">
          <div className="price-chart-stats">
            <div className="pcs-item">
              <span className="pcs-label">Минимум</span>
              <span className="pcs-value pcs-green">{formatPrice(data.min_price)}</span>
            </div>
            <div className="pcs-item">
              <span className="pcs-label">Сейчас</span>
              <span className="pcs-value">{formatPrice(data.current_price)}</span>
            </div>
            <div className="pcs-item">
              <span className="pcs-label">Максимум</span>
              <span className="pcs-value pcs-red">{formatPrice(data.max_price)}</span>
            </div>
          </div>
          <div className="price-chart-svg">
            {renderChart(data.points, data.min_price, data.max_price)}
          </div>
          {data.min_price < data.current_price && (
            <p className="price-chart-hint">
              💡 Минимальная цена была {formatPrice(data.min_price)} — сейчас{' '}
              {Math.round((data.current_price - data.min_price) / data.min_price * 100)}% выше
            </p>
          )}
          {data.current_price <= data.min_price && (
            <p className="price-chart-hint pch-green">
              ✅ Сейчас минимальная цена за 90 дней — отличный момент купить!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
