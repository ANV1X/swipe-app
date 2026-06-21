from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import FriendConnection, User, Swipe, Notification, Product, Collection
from app.schemas import FriendOut, FriendConnectIn, ShareProductIn, ShareCollectionIn
from app.utils import relative_time_ru

router = APIRouter(prefix="/friends", tags=["friends"])

AVATAR_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']


def _avatar_color(user_id: str) -> str:
    return AVATAR_COLORS[hash(user_id) % len(AVATAR_COLORS)]


def _initials(name: str) -> str:
    parts = [p for p in name.split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


def _friend_out(friend_user: User) -> FriendOut:
    last_swipe = friend_user.last_seen_at
    return FriendOut(
        id=friend_user.id,
        first_name=friend_user.first_name or "Гость",
        username=friend_user.username,
        avatar_color=_avatar_color(friend_user.id),
        initials=_initials(friend_user.first_name or "Гость"),
        last_activity=f"Был(а) в сети {relative_time_ru(last_swipe)}" if last_swipe else None,
        since=friend_user.created_at,
    )


@router.get("/", response_model=list[FriendOut])
def list_friends(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(FriendConnection).where(
            or_(FriendConnection.user_a_id == user.id, FriendConnection.user_b_id == user.id)
        )
    ).all()
    out = []
    for r in rows:
        friend_id = r.user_b_id if r.user_a_id == user.id else r.user_a_id
        friend_user = db.get(User, friend_id)
        if friend_user:
            out.append(_friend_out(friend_user))
    return out


@router.post("/connect", response_model=FriendOut)
def connect_friend(
    body: FriendConnectIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    other = db.scalar(select(User).where(User.referral_code == body.code))
    if not other:
        raise HTTPException(status_code=404, detail="Invite code not found")
    if other.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    a, b = sorted([user.id, other.id])
    existing = db.scalar(
        select(FriendConnection).where(FriendConnection.user_a_id == a, FriendConnection.user_b_id == b)
    )
    if not existing:
        db.add(FriendConnection(user_a_id=a, user_b_id=b))
        if user.notif_friend_activity:
            db.add(Notification(
                user_id=user.id, type="friend_activity", title="Новый друг",
                body=f"Вы теперь друзья с {other.first_name}", from_user_id=other.id,
            ))
        if other.notif_friend_activity:
            db.add(Notification(
                user_id=other.id, type="friend_activity", title="Новый друг",
                body=f"{user.first_name} добавил(а) вас в друзья", from_user_id=user.id,
            ))
        db.commit()
    return _friend_out(other)


@router.delete("/{friend_user_id}")
def remove_friend(friend_user_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    a, b = sorted([user.id, friend_user_id])
    conn = db.scalar(
        select(FriendConnection).where(FriendConnection.user_a_id == a, FriendConnection.user_b_id == b)
    )
    if conn:
        db.delete(conn)
        db.commit()
    return {"ok": True}


@router.post("/share/product")
def share_product(
    body: ShareProductIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    product = db.get(Product, body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    a, b = sorted([user.id, body.friend_id])
    is_friend = db.scalar(
        select(FriendConnection).where(FriendConnection.user_a_id == a, FriendConnection.user_b_id == b)
    )
    if not is_friend:
        raise HTTPException(status_code=403, detail="Not friends with this user")
    db.add(Notification(
        user_id=body.friend_id, type="shared_product", product_id=product.id, from_user_id=user.id,
        title="Вам поделились товаром",
        body=f"{user.first_name} советует: {product.title}",
    ))
    db.commit()
    return {"ok": True}


@router.post("/share/collection")
def share_collection(
    body: ShareCollectionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    collection = db.get(Collection, body.collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    a, b = sorted([user.id, body.friend_id])
    is_friend = db.scalar(
        select(FriendConnection).where(FriendConnection.user_a_id == a, FriendConnection.user_b_id == b)
    )
    if not is_friend:
        raise HTTPException(status_code=403, detail="Not friends with this user")
    db.add(Notification(
        user_id=body.friend_id, type="shared_collection", collection_id=collection.id, from_user_id=user.id,
        title="Вам поделились коллекцией",
        body=f"{user.first_name} советует коллекцию «{collection.name}»",
    ))
    db.commit()
    return {"ok": True}
