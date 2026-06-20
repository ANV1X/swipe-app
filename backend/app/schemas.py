from datetime import datetime
from pydantic import BaseModel, Field


# ─── Products ──────────────────────────────────────────────────────────────
class ProductOut(BaseModel):
    id: str
    title: str
    brand: str | None
    price: int
    price_old: int | None
    image_url: str
    marketplace: str
    external_url: str
    category: str
    gender: str | None
    discount_pct: int | None

    class Config:
        from_attributes = True


class ProductMini(BaseModel):
    id: str
    title: str
    brand: str | None
    price: int
    image_url: str

    class Config:
        from_attributes = True


# ─── Swipes ────────────────────────────────────────────────────────────────
class SwipeCreate(BaseModel):
    product_id: str
    direction: str = Field(pattern="^(like|nope|save)$")


class SwipeOut(BaseModel):
    id: str
    product_id: str
    direction: str
    created_at: datetime
    added_to_wishlist: bool = False


class SwipeHistoryItem(BaseModel):
    id: str
    product_id: str
    direction: str
    title: str
    brand: str | None
    price: int
    image_url: str
    marketplace: str
    external_url: str
    created_at: datetime


# ─── Wishlist ──────────────────────────────────────────────────────────────
class WishlistItemOut(BaseModel):
    id: str  # совпадает с product_id для простоты
    product_id: str
    title: str
    brand: str | None
    price: int
    price_old: int | None
    image_url: str
    marketplace: str
    external_url: str
    category: str
    notify_price_drop: bool
    created_at: datetime


class WishlistAdd(BaseModel):
    product_id: str


class WishlistNotifyUpdate(BaseModel):
    notify_price_drop: bool


# ─── Collections ───────────────────────────────────────────────────────────
class CollectionOut(BaseModel):
    id: str
    name: str
    author_name: str
    author_handle: str | None
    author_avatar: str | None
    cover_image: str | None
    subscribers_count: int
    items_count: int
    is_subscribed: bool
    created_at: datetime


class CollectionCreate(BaseModel):
    name: str
    cover_image: str | None = None
    author_handle: str | None = None


# ─── Battles ───────────────────────────────────────────────────────────────
class BattleOut(BaseModel):
    id: str
    active: bool
    votes_a: int
    votes_b: int
    created_at: datetime
    product_a: ProductOut
    product_b: ProductOut
    my_vote: str | None = None


class BattleVoteIn(BaseModel):
    choice: str = Field(pattern="^(a|b)$")


class BattleCreate(BaseModel):
    product_a_id: str
    product_b_id: str


# ─── Friends ───────────────────────────────────────────────────────────────
class FriendOut(BaseModel):
    id: str
    friend_name: str
    friend_handle: str | None
    friend_avatar_color: str
    friend_initials: str | None
    last_activity: str | None
    activity_time: str | None
    created_at: datetime


class FriendCreate(BaseModel):
    friend_name: str
    friend_handle: str | None = None


# ─── Notifications ─────────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    body: str
    product_id: str | None
    read: bool
    created_at: datetime


# ─── Shared wishlists ──────────────────────────────────────────────────────
class SharedWishlistCreate(BaseModel):
    name: str = "Общий вишлист"


class SharedMemberOut(BaseModel):
    user_id: str
    first_name: str
    joined_at: datetime


class SharedItemOut(BaseModel):
    product_id: str
    title: str
    brand: str | None
    price: int
    price_old: int | None
    image_url: str
    marketplace: str
    external_url: str
    added_by: str
    added_by_name: str
    added_at: datetime


class SharedWishlistOut(BaseModel):
    id: str
    name: str
    owner_id: str
    invite_link: str
    member_count: int
    product_count: int
    preview_images: list[str]
    members: list[SharedMemberOut]
    items: list[SharedItemOut]
    created_at: datetime


# ─── Profile ───────────────────────────────────────────────────────────────
class AchievementOut(BaseModel):
    id: str
    title: str
    description: str
    emoji: str
    unlocked: bool
    progress: int
    target: int


class ProfileOut(BaseModel):
    user_id: str
    first_name: str
    username: str | None
    total_swipes: int
    likes: int
    dislikes: int
    wishlist_count: int
    fav_category: str | None
    fav_marketplace: str | None
    member_since: datetime
    referral_code: str
    referral_count: int
    achievements: list[AchievementOut]


# ─── User / onboarding ─────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: str
    telegram_id: int | None
    username: str | None
    first_name: str
    onboarding_done: bool
    pref_gender: str | None
    pref_styles: list[str]
    pref_colors: list[str]
    pref_brands: list[str]
    pref_budget: str | None
    notif_price_drop: bool
    notif_new_in_collection: bool
    notif_friend_activity: bool
    notif_battles: bool
    referral_code: str


class UserUpdate(BaseModel):
    onboarding_done: bool | None = None
    pref_gender: str | None = None
    pref_styles: list[str] | None = None
    pref_colors: list[str] | None = None
    pref_brands: list[str] | None = None
    pref_budget: str | None = None
    notif_price_drop: bool | None = None
    notif_new_in_collection: bool | None = None
    notif_friend_activity: bool | None = None
    notif_battles: bool | None = None


class ReferralRegister(BaseModel):
    code: str
