import { useState, useEffect } from 'react'
import {
  fetchAdminStats, exportAdminUsers, exportAdminSwipes, exportAdminBattles, exportAdminAll,
  createBattle, createCollection, fetchProducts, Product as ApiProduct,
} from '../api/client'
import {
  Users, Heart, Bookmark, Swords, Share2, Download, FileText,
  ChevronDown, Activity, FolderPlus, RefreshCw, ArrowLeft, Shield, X
} from 'lucide-react'

interface Stats {
  users: Record<string, number>
  swipes: Record<string, number>
  battles: Record<string, number>
  wishlist: Record<string, number>
  sharedWishlists: Record<string, number>
  referrals: Record<string, number>
}

type Product = Pick<ApiProduct, 'id' | 'title' | 'brand' | 'price' | 'image_url'>

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateBattle, setShowCreateBattle] = useState(false)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('users')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const data = await fetchAdminStats()
      setStats(data as unknown as Stats)
    } catch (e) {
      console.error('load admin stats failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function exportUsers() {
    try {
      const data = await exportAdminUsers()
      if (data.length) downloadCSV(data, 'users_export.csv')
    } catch (e) { console.error('export users failed', e) }
  }

  async function exportSwipes() {
    try {
      const data = await exportAdminSwipes()
      if (data.length) downloadCSV(data, 'swipes_export.csv')
    } catch (e) { console.error('export swipes failed', e) }
  }

  async function exportBattles() {
    try {
      const data = await exportAdminBattles()
      if (data.length) downloadCSV(data, 'battles_export.csv')
    } catch (e) { console.error('export battles failed', e) }
  }

  async function exportAll() {
    try {
      const allData = await exportAdminAll()
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `full_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error('export all failed', e) }
  }

  function downloadCSV(data: Record<string, unknown>[], filename: string) {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h]
          if (val === null || val === undefined) return ''
          if (typeof val === 'string' && val.includes(',')) return `"${val.replace(/"/g, '""')}"`
          return String(val)
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStat = (section: keyof Stats, key: string): number => stats?.[section]?.[key] ?? 0

  return (
    <div className="admin-page">
      <header className="admin-header">
        <a href="/" className="back-btn">
          <ArrowLeft size={20} />
        </a>
        <div className="admin-header-content">
          <div className="admin-title">
            <Shield size={24} />
            <h1>Админ панель</h1>
          </div>
          <p>Аналитика и управление</p>
        </div>
      </header>

      <div className="admin-toolbar">
        <button onClick={loadStats} className="toolbar-btn" title="Обновить">
          <RefreshCw size={18} />
        </button>
        <button onClick={() => setShowCreateBattle(true)} className="toolbar-btn primary">
          <Swords size={18} />
          <span>Батл</span>
        </button>
        <button onClick={() => setShowCreateCollection(true)} className="toolbar-btn primary">
          <FolderPlus size={18} />
          <span>Коллекция</span>
        </button>
        <div className="export-dropdown">
          <button className="toolbar-btn export">
            <Download size={18} />
            <span>Экспорт</span>
            <ChevronDown size={16} />
          </button>
          <div className="dropdown-menu">
            <button onClick={exportUsers}>
              <Users size={16} /> Пользователи
            </button>
            <button onClick={exportSwipes}>
              <Heart size={16} /> Свайпы
            </button>
            <button onClick={exportBattles}>
              <Swords size={16} /> Батлы
            </button>
            <div className="divider" />
            <button onClick={exportAll} className="full-export">
              <FileText size={16} /> Полный экспорт
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="stat-cards">
            <StatCard
              icon={<Users size={24} />}
              label="Пользователей"
              value={getStat('users', 'total_users')}
              color="emerald"
            />
            <StatCard
              icon={<Activity size={24} />}
              label="Свайпов"
              value={getStat('swipes', 'total_swipes')}
              color="blue"
            />
            <StatCard
              icon={<Share2 size={24} />}
              label="Реферралов"
              value={getStat('referrals', 'total_referrals')}
              color="purple"
            />
            <StatCard
              icon={<Swords size={24} />}
              label="Батлов"
              value={getStat('battles', 'total_battles')}
              color="amber"
            />
          </div>

          <div className="stats-sections">
            <StatsSection
              title="Пользователи"
              icon={<Users size={20} />}
              color="emerald"
              isExpanded={expandedSection === 'users'}
              onToggle={() => setExpandedSection(expandedSection === 'users' ? null : 'users')}
            >
              <div className="detail-grid">
                <DetailStat label="Всего" value={getStat('users', 'total_users')} />
                <DetailStat label="Новых за 24ч" value={getStat('users', 'new_users_24h')} highlight />
                <DetailStat label="Новых за неделю" value={getStat('users', 'new_users_7d')} />
                <DetailStat label="Новых за месяц" value={getStat('users', 'new_users_30d')} />
                <DetailStat label="Активных за 24ч" value={getStat('users', 'active_users_24h')} />
                <DetailStat label="Приглашённых" value={getStat('users', 'users_with_referral')} />
              </div>
            </StatsSection>

            <StatsSection
              title="Свайпы"
              icon={<Heart size={20} />}
              color="rose"
              isExpanded={expandedSection === 'swipes'}
              onToggle={() => setExpandedSection(expandedSection === 'swipes' ? null : 'swipes')}
            >
              <div className="detail-grid">
                <DetailStat label="Всего" value={getStat('swipes', 'total_swipes')} />
                <DetailStat label="Лайков" value={getStat('swipes', 'total_likes')} highlight />
                <DetailStat label="Дизлайков" value={getStat('swipes', 'total_nopes')} />
                <DetailStat label="Сохранений" value={getStat('swipes', 'total_saves')} />
                <DetailStat label="За 24ч" value={getStat('swipes', 'swipes_24h')} />
                <DetailStat label="Уникальных свайперов" value={getStat('swipes', 'unique_swipers')} />
              </div>
            </StatsSection>

            <StatsSection
              title="Батлы"
              icon={<Swords size={20} />}
              color="amber"
              isExpanded={expandedSection === 'battles'}
              onToggle={() => setExpandedSection(expandedSection === 'battles' ? null : 'battles')}
            >
              <div className="detail-grid">
                <DetailStat label="Всего" value={getStat('battles', 'total_battles')} />
                <DetailStat label="Активных" value={getStat('battles', 'active_battles')} highlight />
                <DetailStat label="Всего голосов" value={getStat('battles', 'total_votes')} />
                <DetailStat label="Ср. голосов/батл" value={Math.round(getStat('battles', 'avg_votes_per_battle'))} />
              </div>
            </StatsSection>

            <StatsSection
              title="Вишлисты"
              icon={<Bookmark size={20} />}
              color="blue"
              isExpanded={expandedSection === 'wishlist'}
              onToggle={() => setExpandedSection(expandedSection === 'wishlist' ? null : 'wishlist')}
            >
              <div className="detail-grid">
                <DetailStat label="Всего товаров" value={getStat('wishlist', 'total_wishlist_items')} />
                <DetailStat label="Уникальных товаров" value={getStat('wishlist', 'unique_products_wishlisted')} />
                <DetailStat label="Пользователей с вишлистом" value={getStat('wishlist', 'users_with_wishlist')} />
                <DetailStat label="Совместных вишлистов" value={getStat('sharedWishlists', 'total_shared_wishlists')} />
                <DetailStat label="Участников shared" value={getStat('sharedWishlists', 'total_memberships')} />
              </div>
            </StatsSection>

            <StatsSection
              title="Реферралы"
              icon={<Share2 size={20} />}
              color="purple"
              isExpanded={expandedSection === 'referrals'}
              onToggle={() => setExpandedSection(expandedSection === 'referrals' ? null : 'referrals')}
            >
              <div className="detail-grid">
                <DetailStat label="Всего приглашённых" value={getStat('referrals', 'total_referrals')} />
                <DetailStat label="Уникальных приглашающих" value={getStat('referrals', 'unique_referrers')} />
              </div>
            </StatsSection>
          </div>
        </>
      )}

      {showCreateBattle && <CreateBattleModal onClose={() => setShowCreateBattle(false)} onCreated={loadStats} />}
      {showCreateCollection && <CreateCollectionModal onClose={() => setShowCreateCollection(false)} onCreated={loadStats} />}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-400 to-teal-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-400 to-violet-500',
    amber: 'from-amber-400 to-orange-500',
  }

  return (
    <div className="stat-card">
      <div className={`stat-icon bg-gradient-to-br ${colors[color]}`}>{icon}</div>
      <p className="stat-value">{value.toLocaleString()}</p>
      <p className="stat-label">{label}</p>
    </div>
  )
}

function StatsSection({ title, icon, color, isExpanded, onToggle, children }: { title: string; icon: React.ReactNode; color: string; isExpanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-50',
    rose: 'text-rose-500 bg-rose-50',
    amber: 'text-amber-500 bg-amber-50',
    blue: 'text-blue-500 bg-blue-50',
    purple: 'text-purple-500 bg-purple-50',
  }

  return (
    <div className="stats-section">
      <button onClick={onToggle} className="section-header">
        <div className="section-title">
          <div className={`section-icon ${colors[color]}`}>{icon}</div>
          <span>{title}</span>
        </div>
        <ChevronDown className={`chevron ${isExpanded ? 'rotated' : ''}`} size={20} />
      </button>
      {isExpanded && <div className="section-content">{children}</div>}
    </div>
  )
}

function DetailStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`detail-stat ${highlight ? 'highlight' : ''}`}>
      <p className="detail-value">{value.toLocaleString()}</p>
      <p className="detail-label">{label}</p>
    </div>
  )
}

function CreateBattleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [productA, setProductA] = useState<string>('')
  const [productB, setProductB] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts({}).then(data => setProducts(data.slice(0, 100))).catch(console.error)
  }, [])

  async function create() {
    if (!productA || !productB || productA === productB) return
    setLoading(true)
    try {
      await createBattle(productA, productB)
      onCreated()
      onClose()
    } catch (e) {
      console.error('create battle failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal create-battle-modal">
        <div className="modal-header">
          <h2>Создать батл</h2>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="battle-selects">
          {['A', 'B'].map(side => (
            <div key={side} className="battle-select">
              <label>Товар {side}</label>
              <select
                value={side === 'A' ? productA : productB}
                onChange={(e) => side === 'A' ? setProductA(e.target.value) : setProductB(e.target.value)}
              >
                <option value="">Выберите товар</option>
                {products.filter(p => p.id !== (side === 'A' ? productB : productA)).map(p => (
                  <option key={p.id} value={p.id}>{p.title.slice(0, 50)} - {p.price}</option>
                ))}
              </select>
              {(side === 'A' ? productA : productB) && products.find(p => p.id === (side === 'A' ? productA : productB))?.image_url && (
                <img src={products.find(p => p.id === (side === 'A' ? productA : productB))?.image_url ?? undefined} alt="" />
              )}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn secondary">Отмена</button>
          <button onClick={create} disabled={!productA || !productB || productA === productB || loading} className="btn primary">
            {loading ? 'Создание...' : 'Создать батл'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateCollectionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [authorHandle, setAuthorHandle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!name) return
    setLoading(true)
    try {
      await createCollection(name, coverImage || undefined, authorHandle || undefined)
      onCreated()
      onClose()
    } catch (e) {
      console.error('create collection failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Создать коллекцию</h2>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="form-fields">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название коллекции" />
          <input type="text" value={authorHandle} onChange={(e) => setAuthorHandle(e.target.value)} placeholder="@username автора (необязательно)" />
          <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="URL обложки (необязательно)" />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn secondary">Отмена</button>
          <button onClick={create} disabled={!name || loading} className="btn primary">
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}
