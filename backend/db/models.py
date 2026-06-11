from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime
import uuid


class Base(DeclarativeBase):
    pass


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, nullable=True)
    first_name = Column(String)
    # Онбординг
    onboarding_done = Column(String, nullable=True, default=None)  # None = не прошёл
    preferred_gender = Column(String, nullable=True)   # "male" | "female" | "unisex"
    preferred_categories = Column(String, nullable=True)  # JSON: ["clothes","shoes"]
    preferred_price_max = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    swipes = relationship("Swipe", back_populates="user")
    wishlist = relationship("Wishlist", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    price = Column(Integer, nullable=False)         # в копейках
    price_old = Column(Integer, nullable=True)
    image_url = Column(String, nullable=False)
    marketplace = Column(String, nullable=False)    # "wb" | "ozon" | "lamoda"
    external_url = Column(String, nullable=False)   # партнёрская ссылка
    category = Column(String, nullable=False)       # "clothes" | "shoes" | "accessories"
    gender = Column(String, nullable=True)          # "male" | "female" | "unisex"
    created_at = Column(DateTime, default=datetime.utcnow)

    swipes = relationship("Swipe", back_populates="product")
    wishlist = relationship("Wishlist", back_populates="product")
    price_history = relationship("PriceHistory", back_populates="product")


class Swipe(Base):
    __tablename__ = "swipes"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    direction = Column(String, nullable=False)      # "left" | "right"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="swipes")
    product = relationship("Product", back_populates="swipes")


class Wishlist(Base):
    __tablename__ = "wishlist"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wishlist")
    product = relationship("Product", back_populates="wishlist")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(String, primary_key=True, default=gen_id)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    price = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="price_history")


# ─── Совместный вишлист ────────────────────────────────────────────────────────

class SharedWishlist(Base):
    __tablename__ = "shared_wishlists"

    id         = Column(String, primary_key=True, default=gen_id)  # это и есть токен ссылки
    name       = Column(String, nullable=False, default="Общий вишлист")
    owner_id   = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner      = relationship("User", foreign_keys=[owner_id])
    members    = relationship("SharedWishlistMember", back_populates="shared_wishlist", cascade="all, delete-orphan")
    items      = relationship("SharedWishlistItem", back_populates="shared_wishlist", cascade="all, delete-orphan")


class SharedWishlistMember(Base):
    __tablename__ = "shared_wishlist_members"
    __table_args__ = (UniqueConstraint("shared_wishlist_id", "user_id"),)

    id                 = Column(String, primary_key=True, default=gen_id)
    shared_wishlist_id = Column(String, ForeignKey("shared_wishlists.id"), nullable=False)
    user_id            = Column(String, ForeignKey("users.id"), nullable=False)
    joined_at          = Column(DateTime, default=datetime.utcnow)

    shared_wishlist    = relationship("SharedWishlist", back_populates="members")
    user               = relationship("User")


class SharedWishlistItem(Base):
    __tablename__ = "shared_wishlist_items"
    __table_args__ = (UniqueConstraint("shared_wishlist_id", "product_id", "added_by"),)

    id                 = Column(String, primary_key=True, default=gen_id)
    shared_wishlist_id = Column(String, ForeignKey("shared_wishlists.id"), nullable=False)
    product_id         = Column(String, ForeignKey("products.id"), nullable=False)
    added_by           = Column(String, ForeignKey("users.id"), nullable=False)
    created_at         = Column(DateTime, default=datetime.utcnow)

    shared_wishlist    = relationship("SharedWishlist", back_populates="items")
    product            = relationship("Product")
    user               = relationship("User", foreign_keys=[added_by])
