import { Product, formatPrice } from '../api/client'

interface Props { product: Product }

const MP_COLORS: Record<string, string> = {
  wb:     '#CB11AB',
  ozon:   '#005BFF',
  lamoda: '#1A1A1A',
}

export default function SwipeCard({ product }: Props) {
  const discount = product.price_old
    ? Math.round((1 - product.price / product.price_old) * 100)
    : null
  const mpColor = MP_COLORS[product.marketplace] ?? '#333'

  return (
    <div className="swipe-card">
      <div className="card-image-wrap">
        <img src={product.image_url} alt={product.title} draggable={false} />

        {/* Маркетплейс сверху слева */}
        <div className="card-marketplace-badge" style={{ color: mpColor }}>
          {{ wb: 'Wildberries', ozon: 'Ozon', lamoda: 'Lamoda' }[product.marketplace] ?? product.marketplace}
        </div>

        {/* Скидка сверху справа */}
        {discount && (
          <div className="discount-badge">−{discount}%</div>
        )}
      </div>

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
  )
}
