const BASE_URL = 'https://honest-reflection-production-3f73.up.railway.app'

let _initData = ''
export function setInitData(d: string) { _initData = d }

function headers(): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Init-Data': _initData }
}

// ─── Types ─────────────────────────────────────────────────────────────
export interface Product {
  id: string; title: string; brand: string | null
  price: number; price_old: number | null
  image_url: string; marketplace: string; external_url: string
  category: string; gender: string | null
}

export interface WishlistItem {
  id: string; product_id: string; title: string; brand: string | null
  price: number; price_old: number | null; image_url: string
  marketplace: string; external_url: string; category: string; added_at: string
}

export interface Achievement {
  id: string; title: string; description: string; emoji: string
  unlocked: boolean; progress: number; target: number
}

export interface ProfileData {
  user_id: string; first_name: string; username: string | null
  total_swipes: number; likes: number; dislikes: number
  wishlist_count: number; fav_category: string | null
  fav_marketplace: string | null; member_since: string
  achievements: Achievement[]
}

export interface Deal {
  id: string; title: string; brand: string | null
  price: number; price_old: number | null; image_url: string
  marketplace: string; external_url: string; category: string; discount_pct: number
}

export interface SwipeHistoryItem {
  product_id: string; direction: string; title: string; brand: string | null
  price: number; image_url: string; marketplace: string
  external_url: string; swiped_at: string
}

// ─── Products ──────────────────────────────────────────────────────────
export async function fetchProducts(p?: {
  category?: string; price_max?: number; gender?: string
}): Promise<Product[]> {
  const q = new URLSearchParams()
  if (p?.category) q.set('category', p.category)
  if (p?.price_max) q.set('price_max', String(p.price_max))
  if (p?.gender) q.set('gender', p.gender)
  const res = await fetch(`${BASE_URL}/products/?${q}`, { headers: headers() })
  if (!res.ok) throw new Error('products failed')
  return res.json()
}

// ─── Swipes ────────────────────────────────────────────────────────────
export async function postSwipe(product_id: string, direction: 'left' | 'right') {
  const res = await fetch(`${BASE_URL}/swipe/`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ product_id, direction }),
  })
  if (!res.ok) throw new Error('swipe failed')
  return res.json()
}

// ─── Wishlist ──────────────────────────────────────────────────────────
export async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await fetch(`${BASE_URL}/wishlist/`, { headers: headers() })
  if (!res.ok) throw new Error('wishlist failed')
  return res.json()
}

export async function removeFromWishlist(product_id: string) {
  const res = await fetch(`${BASE_URL}/wishlist/${product_id}/`, {
    method: 'DELETE', headers: headers()
  })
  if (!res.ok) throw new Error('remove failed')
  return res.json()
}

// ─── Profile ───────────────────────────────────────────────────────────
export async function fetchProfile(): Promise<ProfileData> {
  const res = await fetch(`${BASE_URL}/profile/`, { headers: headers() })
  if (!res.ok) throw new Error('profile failed')
  return res.json()
}

// ─── Deals ─────────────────────────────────────────────────────────────
export async function fetchDeals(p?: {
  for_you?: boolean; category?: string
}): Promise<Deal[]> {
  const q = new URLSearchParams()
  if (p?.for_you) q.set('for_you', 'true')
  if (p?.category) q.set('category', p.category)
  const res = await fetch(`${BASE_URL}/deals/?${q}`, { headers: headers() })
  if (!res.ok) throw new Error('deals failed')
  return res.json()
}

export async function addToWishlistById(product_id: string) {
  return postSwipe(product_id, 'right')
}

// ─── History ───────────────────────────────────────────────────────────
export async function fetchHistory(direction?: string): Promise<SwipeHistoryItem[]> {
  const q = new URLSearchParams()
  if (direction) q.set('direction', direction)
  const res = await fetch(`${BASE_URL}/history/?${q}`, { headers: headers() })
  if (!res.ok) throw new Error('history failed')
  return res.json()
}

// ─── Helpers ───────────────────────────────────────────────────────────
export function formatPrice(k: number): string {
  return (k / 100).toLocaleString('ru-RU') + ' ₽'
}

export function marketplaceLabel(mp: string): string {
  return { wb: 'Wildberries', ozon: 'Ozon', lamoda: 'Lamoda' }[mp] ?? mp
}