from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "swipe_users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String)
    last_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    is_premium = Column(Boolean, default=False)
    stars_balance = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    swipes = relationship("Swipe", back_populates="user")
    wishlist_items = relationship("WishlistItem", back_populates="user")
    battle_entries = relationship("BattleEntry", back_populates="user")
    votes = relationship("Vote", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    shared_wishlists = relationship("SharedWishlist", back_populates="user")

class Product(Base):
    __tablename__ = "swipe_products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float)
    old_price = Column(Float, nullable=True)
    currency = Column(String, default="RUB")
    image_url = Column(String)
    category = Column(String, index=True)
    style = Column(String, index=True)
    brand = Column(String, nullable=True)
    marketplace_url = Column(String)
    marketplace = Column(String)
    is_sponsored = Column(Boolean, default=False)
    sponsor_brand = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    swipes = relationship("Swipe", back_populates="product")
    wishlist_items = relationship("WishlistItem", back_populates="product")
    battle_entries = relationship("BattleEntry", back_populates="product")

class Swipe(Base):
    __tablename__ = "swipe_swipes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("swipe_users.id"))
    product_id = Column(Integer, ForeignKey("swipe_products.id"))
    direction = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="swipes")
    product = relationship("Product", back_populates="swipes")

class WishlistItem(Base):
    __tablename__ = "swipe_wishlist_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("swipe_users.id"))
    product_id = Column(Integer, ForeignKey("swipe_products.id"))
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notified_price_drop = Column(Boolean, default=False)

    user = relationship("User", back_populates="wishlist_items")
    product = relationship("Product", back_populates="wishlist_items")

class Battle(Base):
    __tablename__ = "swipe_battles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    prize_description = Column(String)
    prize_type = Column(String)
    prize_value = Column(Integer)
    status = Column(String, default="active")
    created_by = Column(Integer, ForeignKey("swipe_users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    entries = relationship("BattleEntry", back_populates="battle")
    votes = relationship("Vote", back_populates="battle")

class BattleEntry(Base):
    __tablename__ = "swipe_battle_entries"
    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("swipe_battles.id"))
    user_id = Column(Integer, ForeignKey("swipe_users.id"))
    product_id = Column(Integer, ForeignKey("swipe_products.id"), nullable=True)
    outfit_items = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vote_count = Column(Integer, default=0)

    battle = relationship("Battle", back_populates="entries")
    user = relationship("User", back_populates="battle_entries")
    product = relationship("Product", back_populates="battle_entries")

class Vote(Base):
    __tablename__ = "swipe_votes"
    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("swipe_battles.id"))
    entry_id = Column(Integer, ForeignKey("swipe_battle_entries.id"))
    user_id = Column(Integer, ForeignKey("swipe_users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    battle = relationship("Battle", back_populates="votes")
    entry = relationship("BattleEntry")
    user = relationship("User", back_populates="votes")

class Notification(Base):
    __tablename__ = "swipe_notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("swipe_users.id"))
    type = Column(String)
    title = Column(String)
    message = Column(Text)
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")

class SharedWishlist(Base):
    __tablename__ = "swipe_shared_wishlists"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("swipe_users.id"))
    shared_with_id = Column(Integer, ForeignKey("swipe_users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[owner_id], back_populates="shared_wishlists")
    shared_with = relationship("User", foreign_keys=[shared_with_id])

class PriceDrop(Base):
    __tablename__ = "swipe_price_drops"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("swipe_products.id"))
    old_price = Column(Float)
    new_price = Column(Float)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    notified = Column(Boolean, default=False)

    product = relationship("Product")