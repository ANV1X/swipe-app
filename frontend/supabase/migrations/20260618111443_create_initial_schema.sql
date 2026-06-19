
-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  brand text,
  price integer NOT NULL,
  price_old integer,
  image_url text,
  marketplace text DEFAULT 'Lamoda',
  external_url text,
  category text DEFAULT 'Одежда',
  gender text DEFAULT 'unisex',
  discount_pct integer,
  created_at timestamptz DEFAULT now()
);

-- Collections table
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author_name text NOT NULL,
  author_handle text,
  author_avatar text,
  cover_image text,
  subscribers_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Collection items
CREATE TABLE collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Swipes
CREATE TABLE swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  direction text CHECK (direction IN ('like','nope','save')),
  created_at timestamptz DEFAULT now()
);

-- Wishlist
CREATE TABLE wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  notify_price_drop boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Price history
CREATE TABLE price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Battles
CREATE TABLE battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_id uuid REFERENCES products(id) ON DELETE CASCADE,
  product_b_id uuid REFERENCES products(id) ON DELETE CASCADE,
  votes_a integer DEFAULT 0,
  votes_b integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Battle votes
CREATE TABLE battle_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid REFERENCES battles(id) ON DELETE CASCADE,
  user_id uuid,
  choice text CHECK (choice IN ('a','b')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

-- Friends (simple activity feed)
CREATE TABLE friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  friend_name text NOT NULL,
  friend_handle text,
  friend_avatar_color text DEFAULT '#6C4EF2',
  friend_initials text,
  last_activity text,
  activity_time text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Public read for products, collections, battles
CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_collections" ON collections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_collection_items" ON collection_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_price_history" ON price_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_battles" ON battles FOR SELECT TO anon, authenticated USING (true);

-- Swipes: anon can read/insert (no auth required for demo)
CREATE POLICY "anon_read_swipes" ON swipes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_swipes" ON swipes FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Wishlist: anon can read/insert/delete
CREATE POLICY "anon_read_wishlist" ON wishlist FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_wishlist" ON wishlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete_wishlist" ON wishlist FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "anon_update_wishlist" ON wishlist FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Notifications: anon can read/update
CREATE POLICY "anon_read_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Battle votes
CREATE POLICY "anon_read_votes" ON battle_votes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_votes" ON battle_votes FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Friends
CREATE POLICY "anon_read_friends" ON friends FOR SELECT TO anon, authenticated USING (true);
