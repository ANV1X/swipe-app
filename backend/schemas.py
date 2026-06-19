from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    is_premium: bool
    stars_balance: int
    created_at: datetime
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    old_price: Optional[float] = None
    currency: str = "RUB"
    image_url: str
    category: str
    style: str
    brand: Optional[str] = None
    marketplace_url: str
    marketplace: str
    is_sponsored: bool = False
    sponsor_brand: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class SwipeCreate(BaseModel):
    product_id: int
    direction: str

class Swipe(BaseModel):
    id: int
    user_id: int
    product_id: int
    direction: str
    created_at: datetime

class WishlistItemBase(BaseModel):
    product_id: int

class WishlistItem(WishlistItemBase):
    id: int
    user_id: int
    added_at: datetime
    product: Product

class BattleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    prize_description: str
    prize_type: str
    prize_value: int
    status: str = "active"

class Battle(BattleCreate):
    id: int
    created_by: int
    created_at: datetime
    ended_at: Optional[datetime]
    entries: List['BattleEntry'] = []

class BattleEntryCreate(BaseModel):
    product_id: Optional[int] = None
    outfit_items: Optional[List[int]] = None
    description: Optional[str] = None

class BattleEntry(BattleEntryCreate):
    id: int
    battle_id: int
    user_id: int
    created_at: datetime
    vote_count: int
    user: User
    product: Optional[Product] = None

class VoteCreate(BaseModel):
    entry_id: int

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    data: Optional[Any] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

class SharedWishlistCreate(BaseModel):
    shared_with_id: int

class SharedWishlist(SharedWishlistCreate):
    id: int
    owner_id: int
    created_at: datetime

class PriceDropSchema(BaseModel):
    product_id: int
    old_price: float
    new_price: float

class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None