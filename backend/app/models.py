import uuid
import secrets
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_id() -> str:
    return str(uuid.uuid4())


def gen_ref_code() -> str:
    return secrets.token_urlsafe(6).replace("_", "").replace("-", "")[:8]


# ─────────────────────────────────────────────────────────────────────────
# Пользователь
# ─────────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)  # telegram_id как строка, либо анонимный uuid
    telegram_id = Column(BigInteger, nullable=True, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String, default="Гость")
    is_admin = Column(Boolean, default=False)

    # Онбординг / предпочтения
    onboarding_done = Column(Boolean, default=False)
    pref_gender = Column(String, nullable=True)          # male | female | unisex | all
    pref_styles = Column(Text, nullable=True)             # JSON-список строк
    pref_colors = Column(Text, nullable=True)             # JSON-список строк
    pref_brands = Column(Text, nullable=True)             # JSON-список строк
    pref_budget = Column(String, nullable=True)           # budget | mid | high | luxury
    pref_price_max = Column(Integer, nullable=True)

    # Настройки уведомлений
    notif_price_drop = Column(Boolean, default=True)
    notif_new_in_collection = Column(Boolean, default=True)
    notif_friend_activity = Column(Boolean, default=False)
    notif_battles = Column(Boolean, default=True)

    referral_code = Column(String, unique=True, default=gen_ref_code, index=True)
    referred_by = Column(String, nullable=True)  # referral_code пригласившего

    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Товары
# ─────────────────────────────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    price = Column(Integer, nullable=False)          # в рублях
    price_old = Column(Integer, nullable=True)
    image_url = Column(String, nullable=False)
    marketplace = Column(String, nullable=False, default="Lamoda")  # wb | ozon | lamoda
    external_url = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Одежда")     # Одежда | Обувь | Аксессуары
    gender = Column(String, nullable=True)            # male | female | unisex
    discount_pct = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(String, primary_key=True, default=gen_id)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    price = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Свайпы и вишлист
# ─────────────────────────────────────────────────────────────────────────
class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    direction = Column(String, nullable=False)  # like | nope | save
    created_at = Column(DateTime, default=datetime.utcnow)


class Wishlist(Base):
    __tablename__ = "wishlist"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),)

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    notify_price_drop = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Коллекции
# ─────────────────────────────────────────────────────────────────────────
class Collection(Base):
    __tablename__ = "collections"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=True)
    author_name = Column(String, nullable=False)
    author_handle = Column(String, nullable=True)
    author_avatar = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    subscribers_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class CollectionItem(Base):
    __tablename__ = "collection_items"

    id = Column(String, primary_key=True, default=gen_id)
    collection_id = Column(String, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CollectionSubscription(Base):
    __tablename__ = "collection_subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "collection_id", name="uq_sub_user_collection"),)

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    collection_id = Column(String, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Уведомления
# ─────────────────────────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # price_drop | back_in_stock | new_in_collection
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Батлы
# ─────────────────────────────────────────────────────────────────────────
class Battle(Base):
    __tablename__ = "battles"

    id = Column(String, primary_key=True, default=gen_id)
    product_a_id = Column(String, ForeignKey("products.id"), nullable=False)
    product_b_id = Column(String, ForeignKey("products.id"), nullable=False)
    votes_a = Column(Integer, default=0)
    votes_b = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BattleVote(Base):
    __tablename__ = "battle_votes"
    __table_args__ = (UniqueConstraint("battle_id", "user_id", name="uq_vote_battle_user"),)

    id = Column(String, primary_key=True, default=gen_id)
    battle_id = Column(String, ForeignKey("battles.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    choice = Column(String, nullable=False)  # a | b
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Друзья (локальный список контактов пользователя, без обязательной
# регистрации друга в системе — как в адресной книге)
# ─────────────────────────────────────────────────────────────────────────
class Friend(Base):
    __tablename__ = "friends"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    friend_name = Column(String, nullable=False)
    friend_handle = Column(String, nullable=True)
    friend_avatar_color = Column(String, default="#6C4EF2")
    friend_initials = Column(String, nullable=True)
    last_activity = Column(String, nullable=True)
    activity_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Совместные вишлисты
# ─────────────────────────────────────────────────────────────────────────
class SharedWishlist(Base):
    __tablename__ = "shared_wishlists"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False, default="Общий вишлист")
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("SharedWishlistMember", cascade="all, delete-orphan")
    items = relationship("SharedWishlistItem", cascade="all, delete-orphan")


class SharedWishlistMember(Base):
    __tablename__ = "shared_wishlist_members"
    __table_args__ = (UniqueConstraint("shared_wishlist_id", "user_id", name="uq_member"),)

    id = Column(String, primary_key=True, default=gen_id)
    shared_wishlist_id = Column(String, ForeignKey("shared_wishlists.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)


class SharedWishlistItem(Base):
    __tablename__ = "shared_wishlist_items"
    __table_args__ = (
        UniqueConstraint("shared_wishlist_id", "product_id", "added_by", name="uq_shared_item"),
    )

    id = Column(String, primary_key=True, default=gen_id)
    shared_wishlist_id = Column(String, ForeignKey("shared_wishlists.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    added_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────
# Рефералы
# ─────────────────────────────────────────────────────────────────────────
class Referral(Base):
    __tablename__ = "referrals"
    __table_args__ = (UniqueConstraint("referred_user_id", name="uq_referral_referred"),)

    id = Column(String, primary_key=True, default=gen_id)
    referrer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    referred_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
