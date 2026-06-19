import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  title: string
  brand: string | null
  price: number
  price_old: number | null
  image_url: string | null
  marketplace: string
  external_url: string | null
  category: string
  gender: string | null
  discount_pct: number | null
  created_at: string
}

export type Collection = {
  id: string
  name: string
  author_name: string
  author_handle: string | null
  author_avatar: string | null
  cover_image: string | null
  subscribers_count: number
  created_at: string
}

export type WishlistItem = {
  id: string
  user_id: string | null
  product_id: string
  notify_price_drop: boolean
  created_at: string
  products: Product
}

export type Notification = {
  id: string
  user_id: string | null
  type: 'price_drop' | 'back_in_stock' | 'new_in_collection'
  title: string
  body: string
  product_id: string | null
  read: boolean
  created_at: string
  products?: Product | null
}

export type Battle = {
  id: string
  product_a_id: string
  product_b_id: string
  votes_a: number
  votes_b: number
  active: boolean
  created_at: string
  product_a?: Product
  product_b?: Product
}

export type Friend = {
  id: string
  user_id: string | null
  friend_name: string
  friend_handle: string | null
  friend_avatar_color: string
  friend_initials: string | null
  last_activity: string | null
  activity_time: string | null
}

// Anonymous session id stored in localStorage
export function getAnonId(): string {
  let id = localStorage.getItem('anon_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('anon_user_id', id)
  }
  return id
}
