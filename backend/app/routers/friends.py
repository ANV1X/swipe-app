from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Friend, User, Notification
from app.schemas import FriendOut, FriendCreate

router = APIRouter(prefix="/friends", tags=["friends"])

AVATAR_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']


@router.get("/", response_model=list[FriendOut])
def list_friends(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(Friend).where(Friend.user_id == user.id).order_by(Friend.created_at.desc())
    ).all()
    return rows


@router.post("/", response_model=FriendOut)
def add_friend(body: FriendCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    import random
    initials = "".join(p[0] for p in body.friend_name.split() if p).upper()[:2] or "?"
    friend = Friend(
        user_id=user.id,
        friend_name=body.friend_name,
        friend_handle=body.friend_handle,
        friend_avatar_color=random.choice(AVATAR_COLORS),
        friend_initials=initials,
        last_activity="Только что добавлен(а)",
        activity_time="сейчас",
    )
    db.add(friend)
    if user.notif_friend_activity:
        db.add(Notification(
            user_id=user.id, type="friend_activity", title="Новый друг",
            body=f"{body.friend_name} теперь в вашем списке друзей",
        ))
    db.commit()
    db.refresh(friend)
    return friend


@router.delete("/{friend_id}")
def remove_friend(friend_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    friend = db.get(Friend, friend_id)
    if friend and friend.user_id == user.id:
        db.delete(friend)
        db.commit()
    return {"ok": True}
