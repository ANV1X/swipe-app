from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Wishlist, Product, User
from app.schemas import WishlistItemOut, WishlistAdd, WishlistNotifyUpdate

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


def _row_to_out(w: Wishlist, p: Product) -> WishlistItemOut:
    return WishlistItemOut(
        id=p.id, product_id=p.id, title=p.title, brand=p.brand, price=p.price,
        price_old=p.price_old, image_url=p.image_url, marketplace=p.marketplace,
        external_url=p.external_url, category=p.category,
        notify_price_drop=w.notify_price_drop, created_at=w.created_at,
    )


@router.get("/", response_model=list[WishlistItemOut])
def get_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(Wishlist, Product)
        .join(Product, Product.id == Wishlist.product_id)
        .where(Wishlist.user_id == user.id)
        .order_by(Wishlist.created_at.desc())
    ).all()
    return [_row_to_out(w, p) for w, p in rows]


@router.post("/", response_model=WishlistItemOut)
def add_to_wishlist(
    body: WishlistAdd, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    product = db.get(Product, body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.scalar(
        select(Wishlist).where(Wishlist.user_id == user.id, Wishlist.product_id == body.product_id)
    )
    if not existing:
        existing = Wishlist(user_id=user.id, product_id=body.product_id, notify_price_drop=True)
        db.add(existing)
        db.commit()
        db.refresh(existing)
    return _row_to_out(existing, product)


@router.delete("/{product_id}")
def remove_from_wishlist(
    product_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    item = db.scalar(
        select(Wishlist).where(Wishlist.user_id == user.id, Wishlist.product_id == product_id)
    )
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}


@router.patch("/{product_id}", response_model=WishlistItemOut)
def update_wishlist_notify(
    product_id: str,
    body: WishlistNotifyUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = db.scalar(
        select(Wishlist).where(Wishlist.user_id == user.id, Wishlist.product_id == product_id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Not in wishlist")
    item.notify_price_drop = body.notify_price_drop
    db.commit()
    db.refresh(item)
    product = db.get(Product, product_id)
    return _row_to_out(item, product)
