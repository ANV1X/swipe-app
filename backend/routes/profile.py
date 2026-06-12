from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from db.session import get_db
from db.models import User, Swipe, Wishlist, Product
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter()


class Achievement(BaseModel):
    id: str
    title: str
    description: str
    emoji: str
    unlocked: bool
    progress: int       # текущее значение
    target: int         # цель


class ProfileOut(BaseModel):
    user_id: str
    first_name: str
    username: Optional[str]
    total_swipes: int
    likes: int
    dislikes: int
    wishlist_count: int
    fav_category: Optional[str]
    fav_marketplace: Optional[str]
    member_since: datetime
    achievements: list[Achievement]


ACHIEVEMENT_DEFS = [
    # (id, title, description, emoji, target, field)
    ("swipes_10",   "Первые шаги",     "Сделай 10 свайпов",       "👟", 10,   "total_swipes"),
    ("swipes_50",   "Разогрелся",      "Сделай 50 свайпов",       "🔥", 50,   "total_swipes"),
    ("swipes_100",  "Свайпер",         "Сделай 100 свайпов",      "💫", 100,  "total_swipes"),
    ("swipes_500",  "Про-свайпер",     "Сделай 500 свайпов",      "🚀", 500,  "total_swipes"),
    ("likes_5",     "Хороший вкус",    "Лайкни 5 вещей",          "❤️", 5,    "likes"),
    ("likes_20",    "Шопоголик",       "Лайкни 20 вещей",         "🛍️", 20,   "likes"),
    ("likes_50",    "Коллекционер",    "Лайкни 50 вещей",         "💎", 50,   "likes"),
    ("likes_100",   "Модный эксперт",  "Лайкни 100 вещей",        "👑", 100,  "likes"),
    ("wishlist_3",  "Список желаний",  "Добавь 3 вещи в вишлист", "🤍", 3,    "wishlist_count"),
    ("wishlist_10", "Желания растут",  "10 вещей в вишлисте",     "✨", 10,   "wishlist_count"),
    ("wishlist_25", "Большой вишлист", "25 вещей в вишлисте",     "🌟", 25,   "wishlist_count"),
]


@router.get("/", response_model=ProfileOut)
def get_profile(user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = str(user["id"])

    db_user = db.get(User, user_id)
    if not db_user:
        db_user = User(id=user_id, first_name=user.get("first_name",""), username=user.get("username"))
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    total = db.scalar(select(func.count()).where(Swipe.user_id == user_id)) or 0
    likes = db.scalar(select(func.count()).where(Swipe.user_id == user_id, Swipe.direction == "right")) or 0
    wishlist_count = db.scalar(select(func.count()).where(Wishlist.user_id == user_id)) or 0

    fav_cat = db.execute(
        select(Product.category, func.count().label("c"))
        .join(Swipe, Swipe.product_id == Product.id)
        .where(Swipe.user_id == user_id, Swipe.direction == "right")
        .group_by(Product.category).order_by(func.count().desc()).limit(1)
    ).first()

    fav_mp = db.execute(
        select(Product.marketplace, func.count().label("c"))
        .join(Swipe, Swipe.product_id == Product.id)
        .where(Swipe.user_id == user_id, Swipe.direction == "right")
        .group_by(Product.marketplace).order_by(func.count().desc()).limit(1)
    ).first()

    stats = {"total_swipes": total, "likes": likes, "wishlist_count": wishlist_count}

    achievements = [
        Achievement(
            id=a[0], title=a[1], description=a[2], emoji=a[3],
            unlocked=stats[a[5]] >= a[4],
            progress=min(stats[a[5]], a[4]),
            target=a[4],
        )
        for a in ACHIEVEMENT_DEFS
    ]

    return ProfileOut(
        user_id=user_id,
        first_name=db_user.first_name,
        username=db_user.username,
        total_swipes=total,
        likes=likes,
        dislikes=total - likes,
        wishlist_count=wishlist_count,
        fav_category=fav_cat[0] if fav_cat else None,
        fav_marketplace=fav_mp[0] if fav_mp else None,
        member_since=db_user.created_at,
        achievements=achievements,
    )
