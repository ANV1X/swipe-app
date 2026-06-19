import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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

interface Product {
  id: string
  title: string
  brand: string | null
  price: number
  image_url: string | null
}

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
    const [userStats, swipeStats, battleStats, wishlistStats, sharedWishlistStats, referralStats] = await Promise.all([
      supabase.from('user_stats').select('*').limit(1),
      supabase.from('swipe_stats').select('*').limit(1),
      supabase.from('battle_stats').select('*').limit(1),
      supabase.from('wishlist_stats').select('*').limit(1),
      supabase.from('shared_wishlist_stats').select('*').limit(1),
      supabase.from('referral_stats').select('*').limit(1),
    ])

    setStats({
      users: convertRecord(userStats.data?.[0]),
      swipes: convertRecord(swipeStats.data?.[0]),
      battles: convertRecord(battleStats.data?.[0]),
      wishlist: convertRecord(wishlistStats.data?.[0]),
      sharedWishlists: convertRecord(sharedWishlistStats.data?.[0]),
      referrals: convertRecord(referralStats.data?.[0]),
    })
    setLoading(false)
  }

  function convertRecord(record: Record<string, unknown> | undefined): Record<string, number> {
    if (!record) return {}
    const result: Record<string, number> = {}
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'number') result[key] = value
      else if (value === null) result[key] = 0
    }
    return result
  }

  async function exportUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) downloadCSV(data, 'users_export.csv')
  }

  async function exportSwipes() {
    const { data } = await supabase
      .from('swipes')
      .select('id, direction, created_at, profiles(email, display_name), products(title, brand, price)')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (data) {
      const flatData = data.map(s => {
        const p = s.profiles as unknown as { email?: string; display_name?: string } | null
        const pr = s.products as unknown as { title?: string; brand?: string } | null
        return {
          id: s.id,
          user_email: p?.email || '',
          user_name: p?.display_name || '',
          product_title: pr?.title || '',
          product_brand: pr?.brand || '',
          direction: s.direction,
          created_at: s.created_at,
        }
      })
      downloadCSV(flatData, 'swipes_export.csv')
    }
  }

  async function exportBattles() {
    const { data } = await supabase
      .from('battles')
      .select('id, votes_a, votes_b, active, created_at, product_a:products!battles_product_a_id_fkey(title, brand, price), product_b:products!battles_product_b_id_fkey(title, brand, price)')
      .order('created_at', { ascending: false })

    if (data) {
      const flatData = data.map(b => {
        const pa = b.product_a as unknown as { title?: string; brand?: string; price?: number } | null
        const pb = b.product_b as unknown as { title?: string; brand?: string; price?: number } | null
        return {
          id: b.id,
          product_a_title: pa?.title || '',
          product_a_brand: pa?.brand || '',
          product_a_price: pa?.price || 0,
          product_b_title: pb?.title || '',
          product_b_brand: pb?.brand || '',
          product_b_price: pb?.price || 0,
          votes_a: b.votes_a,
          votes_b: b.votes_b,
          total_votes: b.votes_a + b.votes_b,
          active: b.active,
          created_at: b.created_at,
        }
      })
      downloadCSV(flatData, 'battles_export.csv')
    }
  }

  async function exportAll() {
    const [users, swipes, battles, wishlists, referrals] = await Promise.all([
      supabase.from('profiles').select('*').limit(10000),
      supabase.from('swipes').select('id, direction, created_at').limit(10000),
      supabase.from('battles').select('*').limit(1000),
      supabase.from('wishlist').select('*').limit(10000),
      supabase.from('referrals').select('*').limit(10000),
    ])

    const allData = {
      users: users.data,
      swipes: swipes.data,
      battles: battles.data,
      wishlist: wishlists.data,
      referrals: referrals.data,
      exported_at: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `full_export_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
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
    supabase.from('products').select('id, title, brand, price, image_url').limit(100).then(({ data }) => {
      setProducts((data as Product[]) || [])
    })
  }, [])

  async function create() {
    if (!productA || !productB || productA === productB) return
    setLoading(true)
    const { error } = await supabase.from('battles').insert({ product_a_id: productA, product_b_id: productB, active: true })
    if (!error) { onCreated(); onClose() }
    setLoading(false)
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
  const [authorName, setAuthorName] = useState('')
  const [authorHandle, setAuthorHandle] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!name || !authorName) return
    setLoading(true)
    const { error } = await supabase.from('collections').insert({ name, author_name: authorName, author_handle: authorHandle || null })
    if (!error) { onCreated(); onClose() }
    setLoading(false)
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
          <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Имя автора" />
          <input type="text" value={authorHandle} onChange={(e) => setAuthorHandle(e.target.value)} placeholder="@username (необязательно)" />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn secondary">Отмена</button>
          <button onClick={create} disabled={!name || !authorName || loading} className="btn primary">
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}
