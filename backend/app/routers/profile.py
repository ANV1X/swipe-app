from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, is_admin_user
from app.models import Swipe, Wishlist, Product, User, FriendConnection, Referral
from app.schemas import ProfileOut, AchievementOut

router = APIRouter(prefix="/profile", tags=["profile"])


def _achievements(total_swipes: int, likes: int, distinct_categories: int,
                   has_discount_save: bool, friends_count: int) -> list[AchievementOut]:
    defs = [
        dict(id="first_swipe", title="Первый свайп", emoji="🏆",
             desc="Сделай свой первый свайп", value=total_swipes, target=1),
        dict(id="fashionista", title="Стиляга", emoji="💎",
             desc="Полайкай товары из 3 разных категорий", value=distinct_categories, target=3),
        dict(id="discount_sniper", title="Снайпер скидок", emoji="🎯",
             desc="Сохрани товар со скидкой в вишлист", value=1 if has_discount_save else 0, target=1),
        dict(id="hundred_likes", title="100 лайков", emoji="🔥",
             desc="Поставь 100 лайков", value=likes, target=100),
        dict(id="social", title="Душа компании", emoji="🤝",
             desc="Добавь 3 друзей", value=friends_count, target=3),
        dict(id="fashion_king", title="Король моды", emoji="👑",
             desc="Сделай 300 свайпов", value=total_swipes, target=300),
    ]
    out = []
    for d in defs:
        progress = min(d["value"], d["target"])
        out.append(AchievementOut(
            id=d["id"], title=d["title"], description=d["desc"], emoji=d["emoji"],
            unlocked=d["value"] >= d["target"], progress=progress, target=d["target"],
        ))
    return out


@router.get("/", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total_swipes = db.scalar(
        select(func.count()).select_from(Swipe).where(Swipe.user_id == user.id)
    ) or 0
    likes = db.scalar(
        select(func.count()).select_from(Swipe).where(Swipe.user_id == user.id, Swipe.direction == "like")
    ) or 0
    dislikes = db.scalar(
        select(func.count()).select_from(Swipe).where(Swipe.user_id == user.id, Swipe.direction == "nope")
    ) or 0
    wishlist_count = db.scalar(
        select(func.count()).select_from(Wishlist).where(Wishlist.user_id == user.id)
    ) or 0

    wishlist_products = db.scalars(
        select(Product).join(Wishlist, Wishlist.product_id == Product.id).where(Wishlist.user_id == user.id)
    ).all()
    categories = Counter(p.category for p in wishlist_products)
    marketplaces = Counter(p.marketplace for p in wishlist_products)
    fav_category = categories.most_common(1)[0][0] if categories else None
    fav_marketplace = marketplaces.most_common(1)[0][0] if marketplaces else None
    has_discount_save = any(p.price_old for p in wishlist_products)

    from sqlalchemy import or_
    friends_count = db.scalar(
        select(func.count()).select_from(FriendConnection).where(
            or_(FriendConnection.user_a_id == user.id, FriendConnection.user_b_id == user.id)
        )
    ) or 0
    referral_count = db.scalar(
        select(func.count()).select_from(Referral).where(Referral.referrer_id == user.id)
    ) or 0

    achievements = _achievements(
        total_swipes, likes, len(categories), has_discount_save, friends_count
    )

    return ProfileOut(
        user_id=user.id, first_name=user.first_name, username=user.username,
        is_admin=is_admin_user(user),
        total_swipes=total_swipes, likes=likes, dislikes=dislikes,
        wishlist_count=wishlist_count, fav_category=fav_category, fav_marketplace=fav_marketplace,
        member_since=user.created_at, referral_code=user.referral_code,
        referral_count=referral_count, achievements=achievements,
    )
