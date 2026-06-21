from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_admin
from app.models import (
    User, Swipe, Battle, BattleVote, Wishlist, SharedWishlist, SharedWishlistMember,
    Referral, Product, Collection, FriendConnection,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    now = datetime.utcnow()
    d1, d7, d30 = now - timedelta(days=1), now - timedelta(days=7), now - timedelta(days=30)

    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    new_24h = db.scalar(select(func.count()).select_from(User).where(User.created_at >= d1)) or 0
    new_7d = db.scalar(select(func.count()).select_from(User).where(User.created_at >= d7)) or 0
    new_30d = db.scalar(select(func.count()).select_from(User).where(User.created_at >= d30)) or 0
    active_24h = db.scalar(select(func.count()).select_from(User).where(User.last_seen_at >= d1)) or 0
    with_referral = db.scalar(
        select(func.count()).select_from(User).where(User.referred_by.is_not(None))
    ) or 0

    total_swipes = db.scalar(select(func.count()).select_from(Swipe)) or 0
    total_likes = db.scalar(select(func.count()).select_from(Swipe).where(Swipe.direction == "like")) or 0
    total_nopes = db.scalar(select(func.count()).select_from(Swipe).where(Swipe.direction == "nope")) or 0
    total_saves = db.scalar(select(func.count()).select_from(Swipe).where(Swipe.direction == "save")) or 0
    swipes_24h = db.scalar(select(func.count()).select_from(Swipe).where(Swipe.created_at >= d1)) or 0
    unique_swipers = db.scalar(select(func.count(distinct(Swipe.user_id)))) or 0

    total_battles = db.scalar(select(func.count()).select_from(Battle)) or 0
    active_battles = db.scalar(select(func.count()).select_from(Battle).where(Battle.active.is_(True))) or 0
    total_votes = db.scalar(select(func.count()).select_from(BattleVote)) or 0
    avg_votes = (total_votes / total_battles) if total_battles else 0

    total_wishlist_items = db.scalar(select(func.count()).select_from(Wishlist)) or 0
    unique_products_wishlisted = db.scalar(select(func.count(distinct(Wishlist.product_id)))) or 0
    users_with_wishlist = db.scalar(select(func.count(distinct(Wishlist.user_id)))) or 0

    total_shared = db.scalar(select(func.count()).select_from(SharedWishlist)) or 0
    total_memberships = db.scalar(select(func.count()).select_from(SharedWishlistMember)) or 0

    total_referrals = db.scalar(select(func.count()).select_from(Referral)) or 0
    unique_referrers = db.scalar(select(func.count(distinct(Referral.referrer_id)))) or 0

    total_friend_connections = db.scalar(select(func.count()).select_from(FriendConnection)) or 0
    total_collections = db.scalar(select(func.count()).select_from(Collection)) or 0
    official_collections = db.scalar(
        select(func.count()).select_from(Collection).where(Collection.is_official.is_(True))
    ) or 0

    return {
        "users": {
            "total_users": total_users, "new_users_24h": new_24h, "new_users_7d": new_7d,
            "new_users_30d": new_30d, "active_users_24h": active_24h, "users_with_referral": with_referral,
        },
        "swipes": {
            "total_swipes": total_swipes, "total_likes": total_likes, "total_nopes": total_nopes,
            "total_saves": total_saves, "swipes_24h": swipes_24h, "unique_swipers": unique_swipers,
        },
        "battles": {
            "total_battles": total_battles, "active_battles": active_battles,
            "total_votes": total_votes, "avg_votes_per_battle": avg_votes,
        },
        "wishlist": {
            "total_wishlist_items": total_wishlist_items,
            "unique_products_wishlisted": unique_products_wishlisted,
            "users_with_wishlist": users_with_wishlist,
        },
        "sharedWishlists": {
            "total_shared_wishlists": total_shared, "total_memberships": total_memberships,
        },
        "referrals": {
            "total_referrals": total_referrals, "unique_referrers": unique_referrers,
        },
        "social": {
            "total_friend_connections": total_friend_connections,
            "total_collections": total_collections,
            "official_collections": official_collections,
        },
    }


@router.get("/export/users")
def export_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [
        {
            "id": u.id, "telegram_id": u.telegram_id, "username": u.username,
            "first_name": u.first_name, "onboarding_done": u.onboarding_done,
            "pref_gender": u.pref_gender, "pref_budget": u.pref_budget,
            "referral_code": u.referral_code, "referred_by": u.referred_by,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/export/swipes")
def export_swipes(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    rows = db.execute(
        select(Swipe, User, Product)
        .join(User, User.id == Swipe.user_id)
        .join(Product, Product.id == Swipe.product_id)
        .order_by(Swipe.created_at.desc())
        .limit(10000)
    ).all()
    return [
        {
            "id": s.id, "user_id": u.id, "user_name": u.first_name, "username": u.username,
            "product_title": p.title, "product_brand": p.brand, "direction": s.direction,
            "created_at": s.created_at.isoformat(),
        }
        for s, u, p in rows
    ]


@router.get("/export/battles")
def export_battles(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    battles = db.scalars(select(Battle).order_by(Battle.created_at.desc())).all()
    out = []
    for b in battles:
        ca = db.get(Collection, b.collection_a_id)
        cb = db.get(Collection, b.collection_b_id)
        out.append({
            "id": b.id,
            "collection_a_name": ca.name if ca else "", "collection_a_author": ca.author_name if ca else "",
            "collection_b_name": cb.name if cb else "", "collection_b_author": cb.author_name if cb else "",
            "prize_title": b.prize_title or "",
            "votes_a": b.votes_a, "votes_b": b.votes_b, "total_votes": b.votes_a + b.votes_b,
            "active": b.active, "created_at": b.created_at.isoformat(),
        })
    return out


@router.get("/export/all")
def export_all(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    users = export_users(db=db, _admin=_admin)
    swipes = export_swipes(db=db, _admin=_admin)
    battles = export_battles(db=db, _admin=_admin)
    wishlist = db.scalars(select(Wishlist)).all()
    referrals = db.scalars(select(Referral)).all()
    return {
        "users": users,
        "swipes": swipes,
        "battles": battles,
        "wishlist": [
            {"id": w.id, "user_id": w.user_id, "product_id": w.product_id, "created_at": w.created_at.isoformat()}
            for w in wishlist
        ],
        "referrals": [
            {"id": r.id, "referrer_id": r.referrer_id, "referred_user_id": r.referred_user_id,
             "created_at": r.created_at.isoformat()}
            for r in referrals
        ],
        "exported_at": datetime.utcnow().isoformat(),
    }
