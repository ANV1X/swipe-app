import { useState } from 'react'
import { Product, formatPrice, marketplaceLabel } from '../api/client'

interface Props { product: Product }

const MP_COLORS: Record<string, string> = {
  wb:     '#CB11AB',
  ozon:   '#005BFF',
  lamoda: '#1A1A1A',
}

export default function SwipeCard({ product }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  const discount = product.price_old
    ? Math.round((1 - product.price / product.price_old) * 100)
    : null
  const mpColor = MP_COLORS[product.marketplace] ?? '#333'

  return (
    <div className="swipe-card">
      <div className="card-image-wrap">
        {!imgFailed ? (
          <img
            src={product.image_url}
            alt=""
            draggable={false}
            className="card-img"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="card-img-fallback" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
        )}

        {/* затемнение снизу для читабельности текста */}
        <div className="card-scrim" />

        {/* верхние бейджи */}
        <div className="card-badges">
          <span className="card-mp-badge" style={{ color: mpColor }}>
            {marketplaceLabel(product.marketplace)}
          </span>
          {discount && <span className="card-discount-badge">{`−${discount}%`}</span>}
        </div>

        {/* инфо о товаре */}
        <div className="card-info">
          {product.brand && <p className="card-brand">{product.brand}</p>}
          <p className="card-title">{product.title}</p>
          <div className="card-price-row">
            <span className="card-price">{formatPrice(product.price)}</span>
            {product.price_old && (
              <span className="card-price-old">{formatPrice(product.price_old)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
