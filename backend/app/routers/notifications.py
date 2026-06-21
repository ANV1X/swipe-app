from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Notification, User, Wishlist, Product
from app.schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _to_out(db: Session, n: Notification) -> NotificationOut:
    from_user_name = None
    if n.from_user_id:
        from_user = db.get(User, n.from_user_id)
        from_user_name = from_user.first_name if from_user else None
    return NotificationOut(
        id=n.id, type=n.type, title=n.title, body=n.body,
        product_id=n.product_id, collection_id=n.collection_id, from_user_id=n.from_user_id,
        from_user_name=from_user_name, read=n.read, created_at=n.created_at,
    )


def generate_price_drop_notifications(db: Session, user: User) -> None:
    """
    Реальная (не выдуманная) генерация уведомлений: смотрим товары в вишлисте
    пользователя со скидкой, на которые включены уведомления, и если для них
    ещё не создавали оповещение — создаём.
    """
    if not user.notif_price_drop:
        return
    rows = db.execute(
        select(Wishlist, Product)
        .join(Product, Product.id == Wishlist.product_id)
        .where(Wishlist.user_id == user.id, Wishlist.notify_price_drop.is_(True), Product.price_old.is_not(None))
    ).all()
    for w, p in rows:
        exists = db.scalar(
            select(Notification).where(
                Notification.user_id == user.id,
                Notification.product_id == p.id,
                Notification.type == "price_drop",
            )
        )
        if exists:
            continue
        drop_pct = round((1 - p.price / p.price_old) * 100) if p.price_old else 0
        db.add(Notification(
            user_id=user.id, type="price_drop", title="Цена снижена!",
            body=f"{p.title} подешевел на {drop_pct}% — теперь {p.price:,} ₽".replace(",", " "),
            product_id=p.id,
        ))
    db.commit()


@router.get("/", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    generate_price_drop_notifications(db, user)
    rows = db.scalars(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())
    ).all()
    return [_to_out(db, n) for n in rows]


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    generate_price_drop_notifications(db, user)
    count = db.scalar(
        select(func.count()).select_from(Notification)
        .where(Notification.user_id == user.id, Notification.read.is_(False))
    ) or 0
    return {"count": count}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    n = db.get(Notification, notification_id)
    if not n or n.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    n.read = True
    db.commit()
    db.refresh(n)
    return _to_out(db, n)


@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.execute(
        update(Notification).where(Notification.user_id == user.id, Notification.read.is_(False))
        .values(read=True)
    )
    db.commit()
    return {"ok": True}
