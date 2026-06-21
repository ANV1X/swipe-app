// ─────────────────────────────────────────────────────────────────────────
// Единый клиент для общения с собственным backend (FastAPI + PostgreSQL).
// Никакого Supabase — все данные живут в реальной базе данных на сервере.
// ─────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'https://honest-reflection-production-3f73.up.railway.app'

let _initData = ''
export function setInitData(d: string) { _initData = d }

const ANON_ID_KEY = 'swipe_anon_id'
export function getAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_initData) h['X-Init-Data'] = _initData
  else h['X-Anon-Id'] = getAnonId()
  return h
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers: headers() })
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json())?.detail ?? '' } catch { /* noop */ }
    throw new Error(detail || `Request failed: ${path} (${res.status})`)
  }
  if (res.status === 204) return undefined as unknown as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

// ─── Types ─────────────────────────────────────────────────────────────
export interface Product {
  id: string; title: string; brand: string | null
  price: number; price_old: number | null
  image_url: string; marketplace: string; external_url: string
  category: string; gender: string | null
  style: string | null; color: string | null
  discount_pct: number | null
}

export interface Deal extends Product { discount_pct: number }

export interface WishlistItem {
  id: string; product_id: string; title: string; brand: string | null
  price: number; price_old: number | null; image_url: string
  marketplace: string; external_url: string; category: string
  notify_price_drop: boolean; created_at: string
}

export interface Achievement {
  id: string; title: string; description: string; emoji: string
  unlocked: boolean; progress: number; target: number
}

export interface ProfileData {
  user_id: string; first_name: string; username: string | null
  is_admin: boolean
  total_swipes: number; likes: number; dislikes: number
  wishlist_count: number; fav_category: string | null
  fav_marketplace: string | null; member_since: string
  referral_code: string; referral_count: number
  achievements: Achievement[]
}

export interface SwipeHistoryItem {
  id: string; product_id: string; direction: string; title: string; brand: string | null
  price: number; image_url: string; marketplace: string
  external_url: string; created_at: string
}

export interface CollectionData {
  id: string; name: string; author_id: string | null; author_name: string; author_handle: string | null
  author_avatar: string | null; cover_image: string | null
  subscribers_count: number; items_count: number; is_subscribed: boolean
  is_official: boolean
  created_at: string
}

export interface BattleCollectionSide {
  id: string; name: string; cover_image: string | null
  author_name: string; items_count: number; preview_images: string[]
}

export interface BattleData {
  id: string; active: boolean; votes_a: number; votes_b: number
  prize_emoji: string; prize_title: string | null
  created_at: string
  collection_a: BattleCollectionSide; collection_b: BattleCollectionSide
  my_vote: 'a' | 'b' | null
}

export interface BattleSubmissionResult {
  status: 'waiting' | 'matched'
  battle_id: string | null
}

export interface FriendData {
  id: string; first_name: string; username: string | null
  avatar_color: string; initials: string
  last_activity: string | null; since: string
}

export interface NotificationData {
  id: string; type: string; title: string; body: string
  product_id: string | null; collection_id: string | null
  from_user_id: string | null; from_user_name: string | null
  read: boolean; created_at: string
}

export interface SharedMember { user_id: string; first_name: string; joined_at: string }
export interface SharedItem {
  product_id: string; title: string; brand: string | null; price: number
  price_old: number | null; image_url: string; marketplace: string
  external_url: string; added_by: string; added_by_name: string; added_at: string
}
export interface SharedWishlistData {
  id: string; name: string; owner_id: string; invite_link: string
  member_count: number; product_count: number; preview_images: string[]
  members: SharedMember[]; items: SharedItem[]; created_at: string
}

export interface UserData {
  id: string; telegram_id: number | null; username: string | null; first_name: string
  is_admin: boolean
  onboarding_done: boolean; pref_gender: string | null
  pref_styles: string[]; pref_colors: string[]; pref_brands: string[]
  pref_budget: string | null
  notif_price_drop: boolean; notif_new_in_collection: boolean
  notif_friend_activity: boolean; notif_battles: boolean
  referral_code: string
}

export type UserUpdate = Partial<Omit<UserData, 'id' | 'telegram_id' | 'username' | 'referral_code' | 'is_admin'>>

// ─── Products ──────────────────────────────────────────────────────────
export interface ProductFilters {
  category?: string; price_max?: number; gender?: string
  style?: string; color?: string
  exclude_swiped?: boolean; personalized?: boolean
}

export async function fetchProducts(p?: ProductFilters): Promise<Product[]> {
  const q = new URLSearchParams()
  if (p?.category) q.set('category', p.category)
  if (p?.price_max) q.set('price_max', String(p.price_max))
  if (p?.gender) q.set('gender', p.gender)
  if (p?.style) q.set('style', p.style)
  if (p?.color) q.set('color', p.color)
  if (p?.exclude_swiped) q.set('exclude_swiped', 'true')
  if (p?.personalized === false) q.set('personalized', 'false')
  return request(`/products/?${q}`)
}

export async function fetchDeals(p?: { for_you?: boolean; category?: string }): Promise<Deal[]> {
  const q = new URLSearchParams()
  if (p?.for_you) q.set('for_you', 'true')
  if (p?.category) q.set('category', p.category)
  return request(`/products/deals?${q}`)
}

export async function fetchForYou(limit = 6): Promise<Product[]> {
  return request(`/products/foryou?limit=${limit}`)
}

export async function fetchForYouMeta(): Promise<{ match_count: number; match_pct: number }> {
  return request('/products/foryou/meta')
}

// ─── Swipes ────────────────────────────────────────────────────────────
export async function postSwipe(product_id: string, direction: 'like' | 'nope' | 'save') {
  return request<{ id: string; added_to_wishlist: boolean }>('/swipes/', {
    method: 'POST', body: JSON.stringify({ product_id, direction }),
  })
}

export async function fetchHistory(direction?: string, limit = 50): Promise<SwipeHistoryItem[]> {
  const q = new URLSearchParams()
  if (direction) q.set('direction', direction)
  q.set('limit', String(limit))
  return request(`/swipes/history?${q}`)
}

// ─── Wishlist ──────────────────────────────────────────────────────────
export async function fetchWishlist(): Promise<WishlistItem[]> {
  return request('/wishlist/')
}

export async function addToWishlist(product_id: string): Promise<WishlistItem> {
  return request('/wishlist/', { method: 'POST', body: JSON.stringify({ product_id }) })
}

export async function removeFromWishlist(product_id: string) {
  return request(`/wishlist/${product_id}`, { method: 'DELETE' })
}

export async function updateWishlistNotify(product_id: string, notify_price_drop: boolean) {
  return request<WishlistItem>(`/wishlist/${product_id}`, {
    method: 'PATCH', body: JSON.stringify({ notify_price_drop }),
  })
}

// ─── Collections ───────────────────────────────────────────────────────
export type CollectionTab = 'popular' | 'new' | 'subscribed' | 'official' | 'community'

export async function fetchCollections(tab: CollectionTab = 'popular'): Promise<CollectionData[]> {
  return request(`/collections/?tab=${tab}`)
}

export async function fetchMyCollections(): Promise<CollectionData[]> {
  return request('/collections/mine')
}

export async function fetchCollectionItems(id: string): Promise<Product[]> {
  return request(`/collections/${id}/items`)
}

export async function createCollection(name: string, cover_image?: string, author_handle?: string): Promise<CollectionData> {
  return request('/collections/', { method: 'POST', body: JSON.stringify({ name, cover_image, author_handle }) })
}

export async function subscribeCollection(id: string): Promise<CollectionData> {
  return request(`/collections/${id}/subscribe`, { method: 'POST' })
}

export async function unsubscribeCollection(id: string): Promise<CollectionData> {
  return request(`/collections/${id}/subscribe`, { method: 'DELETE' })
}

export async function addCollectionItem(collectionId: string, productId: string): Promise<Product[]> {
  return request(`/collections/${collectionId}/items/${productId}`, { method: 'POST' })
}

export async function removeCollectionItem(collectionId: string, productId: string): Promise<Product[]> {
  return request(`/collections/${collectionId}/items/${productId}`, { method: 'DELETE' })
}

// ─── Battles ───────────────────────────────────────────────────────────
export async function fetchActiveBattle(): Promise<BattleData | null> {
  return request('/battles/active')
}

export async function voteBattle(id: string, choice: 'a' | 'b'): Promise<BattleData> {
  return request(`/battles/${id}/vote`, { method: 'POST', body: JSON.stringify({ choice }) })
}

export async function createBattle(
  collection_a_id: string, collection_b_id: string, prize_title?: string, prize_emoji = '🏆'
): Promise<BattleData> {
  return request('/battles/', {
    method: 'POST',
    body: JSON.stringify({ collection_a_id, collection_b_id, prize_title, prize_emoji }),
  })
}

export async function submitToBattle(collectionId: string): Promise<BattleSubmissionResult> {
  return request('/battles/submit', { method: 'POST', body: JSON.stringify({ collection_id: collectionId }) })
}

export async function cancelBattleSubmission(collectionId: string) {
  return request(`/battles/submit/${collectionId}`, { method: 'DELETE' })
}

// ─── Friends ───────────────────────────────────────────────────────────
export async function fetchFriends(): Promise<FriendData[]> {
  return request('/friends/')
}

export async function connectFriend(code: string): Promise<FriendData> {
  return request('/friends/connect', { method: 'POST', body: JSON.stringify({ code }) })
}

export async function removeFriend(friendUserId: string) {
  return request(`/friends/${friendUserId}`, { method: 'DELETE' })
}

export async function shareProductToFriend(friendId: string, productId: string) {
  return request('/friends/share/product', {
    method: 'POST', body: JSON.stringify({ friend_id: friendId, product_id: productId }),
  })
}

export async function shareCollectionToFriend(friendId: string, collectionId: string) {
  return request('/friends/share/collection', {
    method: 'POST', body: JSON.stringify({ friend_id: friendId, collection_id: collectionId }),
  })
}

// ─── Notifications ─────────────────────────────────────────────────────
export async function fetchNotifications(): Promise<NotificationData[]> {
  return request('/notifications/')
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  return request('/notifications/unread-count')
}

export async function markNotificationRead(id: string) {
  return request(`/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'PATCH' })
}

// ─── Shared wishlists ──────────────────────────────────────────────────
export async function fetchSharedWishlists(): Promise<SharedWishlistData[]> {
  return request('/shared-wishlists/')
}

export async function createSharedWishlist(name: string): Promise<SharedWishlistData> {
  return request('/shared-wishlists/', { method: 'POST', body: JSON.stringify({ name }) })
}

export async function getSharedWishlist(id: string): Promise<SharedWishlistData> {
  return request(`/shared-wishlists/${id}`)
}

export async function joinSharedWishlist(id: string): Promise<SharedWishlistData> {
  return request(`/shared-wishlists/${id}/join`, { method: 'POST' })
}

export async function addToSharedWishlist(wishlistId: string, productId: string): Promise<SharedWishlistData> {
  return request(`/shared-wishlists/${wishlistId}/items/${productId}`, { method: 'POST' })
}

export async function removeFromSharedWishlist(wishlistId: string, productId: string) {
  return request(`/shared-wishlists/${wishlistId}/items/${productId}`, { method: 'DELETE' })
}

// ─── Profile ───────────────────────────────────────────────────────────
// Простой кэш в памяти модуля — чтобы при повторном заходе на вкладку
// «Профиль» данные показывались мгновенно, без спиннера, а обновлялись
// в фоне (stale-while-revalidate).
let _profileCache: ProfileData | null = null
export function getCachedProfile(): ProfileData | null { return _profileCache }

export async function fetchProfile(): Promise<ProfileData> {
  const data = await request<ProfileData>('/profile/')
  _profileCache = data
  return data
}

// ─── User / onboarding ─────────────────────────────────────────────────
let _meCache: UserData | null = null
export function getCachedMe(): UserData | null { return _meCache }

export async function fetchMe(): Promise<UserData> {
  const data = await request<UserData>('/users/me')
  _meCache = data
  return data
}

export async function updateMe(patch: UserUpdate): Promise<UserData> {
  const data = await request<UserData>('/users/me', { method: 'PATCH', body: JSON.stringify(patch) })
  _meCache = data
  return data
}

export async function registerReferral(code: string): Promise<{ ok: boolean }> {
  return request('/users/me/referral', { method: 'POST', body: JSON.stringify({ code }) })
}

// ─── Admin ─────────────────────────────────────────────────────────────
export async function fetchAdminStats(): Promise<Record<string, Record<string, number>>> {
  return request('/admin/stats')
}

export async function exportAdminUsers(): Promise<Record<string, unknown>[]> {
  return request('/admin/export/users')
}

export async function exportAdminSwipes(): Promise<Record<string, unknown>[]> {
  return request('/admin/export/swipes')
}

export async function exportAdminBattles(): Promise<Record<string, unknown>[]> {
  return request('/admin/export/battles')
}

export async function exportAdminAll(): Promise<Record<string, unknown>> {
  return request('/admin/export/all')
}

// ─── Price history ─────────────────────────────────────────────────────
export interface PricePoint { date: string; price: number }
export interface PriceHistoryData {
  product_id: string; current_price: number; min_price: number; max_price: number
  points: PricePoint[]
}

export async function fetchPriceHistory(productId: string): Promise<PriceHistoryData> {
  return request(`/products/${productId}/price-history`)
}

// ─── Onboarding taxonomy (используется и в анкете, и в фильтрах ленты) ──
export const STYLE_OPTIONS = [
  { id: 'minimal', label: 'Minimal', emoji: '🤍' },
  { id: 'casual', label: 'Casual', emoji: '👕' },
  { id: 'street', label: 'Street', emoji: '🧢' },
  { id: 'smart', label: 'Smart', emoji: '👔' },
  { id: 'sport', label: 'Sport', emoji: '🏃' },
  { id: 'romantic', label: 'Romantic', emoji: '🌸' },
  { id: 'dark', label: 'Dark', emoji: '🖤' },
  { id: 'boho', label: 'Boho', emoji: '🌿' },
]

export const COLOR_OPTIONS = [
  { id: 'black', label: 'Чёрный', hex: '#1C1C1E' },
  { id: 'white', label: 'Белый', hex: '#F5F5F0', border: true },
  { id: 'beige', label: 'Бежевый', hex: '#D4C4A8' },
  { id: 'khaki', label: 'Хаки', hex: '#8B8560' },
  { id: 'navy', label: 'Синий', hex: '#1A3A6E' },
  { id: 'gray', label: 'Серый', hex: '#8E8E8E' },
  { id: 'brown', label: 'Коричневый', hex: '#7B5B3A' },
  { id: 'green', label: 'Зелёный', hex: '#3A7D44' },
  { id: 'pink', label: 'Розовый', hex: '#E8849A' },
  { id: 'red', label: 'Красный', hex: '#C0392B' },
]

// ─── Helpers ───────────────────────────────────────────────────────────
export function formatPrice(p: number): string {
  return p.toLocaleString('ru-RU') + ' ₽'
}

const MARKETPLACE_LABELS: Record<string, string> = {
  wb: 'Wildberries', ozon: 'Ozon', lamoda: 'Lamoda',
  wildberries: 'Wildberries',
}

export function marketplaceLabel(mp: string): string {
  return MARKETPLACE_LABELS[mp.toLowerCase()] ?? mp
}

export function styleLabel(id: string | null): string {
  return STYLE_OPTIONS.find(s => s.id === id)?.label ?? id ?? ''
}

export function colorHex(id: string | null): string {
  return COLOR_OPTIONS.find(c => c.id === id)?.hex ?? '#999'
}

export function colorLabel(id: string | null): string {
  return COLOR_OPTIONS.find(c => c.id === id)?.label ?? id ?? ''
}
