import { useEffect, useState } from 'react'
import { ArrowLeft, Heart, X, Bookmark } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase, Product, getAnonId } from '../lib/supabase'

type SwipeRecord = {
  id: string
  direction: 'like' | 'nope' | 'save'
  created_at: string
  products: Product
}

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d >= 1) return `${d} д. назад`
  if (h >= 1) return `${h} ч. назад`
  return 'только что'
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SwipeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const userId = getAnonId()

  useEffect(() => {
    supabase
      .from('swipes')
      .select('*, products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setHistory((data || []) as SwipeRecord[])
        setLoading(false)
      })
  }, [])

  const likes = history.filter(h => h.direction === 'like')
  const saved = history.filter(h => h.direction === 'save')

  return (
    <div className="page-bg">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700 }}>История свайпов</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px' }}>
        <div className="profile-stat-card" style={{ flex: 1 }}>
          <div className="profile-stat-value" style={{ color: 'var(--green)' }}>{likes.length}</div>
          <div className="profile-stat-label">Лайков</div>
        </div>
        <div className="profile-stat-card" style={{ flex: 1 }}>
          <div className="profile-stat-value" style={{ color: 'var(--red)' }}>{history.filter(h => h.direction === 'nope').length}</div>
          <div className="profile-stat-label">Пропущено</div>
        </div>
        <div className="profile-stat-card" style={{ flex: 1 }}>
          <div className="profile-stat-value" style={{ color: 'var(--accent)' }}>{saved.length}</div>
          <div className="profile-stat-label">Сохранено</div>
        </div>
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : history.length === 0 ? (
        <div className="page-center">
          <div style={{ fontSize: 15, color: 'var(--text2)' }}>Нет истории</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map(h => {
            const p = h.products
            if (!p) return null
            return (
              <div key={h.id} style={{
                display: 'flex',
                gap: 12,
                background: 'var(--surface)',
                borderRadius: 16,
                padding: 12,
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <img src={p.image_url || ''} alt={p.title} style={{
                  width: 56,
                  height: 70,
                  borderRadius: 10,
                  objectFit: 'cover',
                  objectPosition: 'top',
                  background: 'var(--surface2)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{p.brand || p.marketplace}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{formatPrice(p.price)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: h.direction === 'like' ? 'rgba(52,199,89,0.12)' : h.direction === 'save' ? 'var(--accent-light)' : 'var(--red-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {h.direction === 'like' && <Heart size={14} color="var(--green)" />}
                    {h.direction === 'nope' && <X size={14} color="var(--red)" />}
                    {h.direction === 'save' && <Bookmark size={14} color="var(--accent)" />}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{timeAgo(h.created_at)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
