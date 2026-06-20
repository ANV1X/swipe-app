from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Swipe, Wishlist, Product, User
from app.schemas import SwipeCreate, SwipeOut, SwipeHistoryItem

router = APIRouter(prefix="/swipes", tags=["swipes"])


@router.post("/", response_model=SwipeOut)
def create_swipe(
    body: SwipeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.get(Product, body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    swipe = Swipe(user_id=user.id, product_id=body.product_id, direction=body.direction)
    db.add(swipe)

    added_to_wishlist = False
    if body.direction in ("like", "save"):
        existing = db.scalar(
            select(Wishlist).where(Wishlist.user_id == user.id, Wishlist.product_id == body.product_id)
        )
        if not existing:
            db.add(Wishlist(user_id=user.id, product_id=body.product_id, notify_price_drop=True))
            added_to_wishlist = True

    db.commit()
    db.refresh(swipe)
    return SwipeOut(
        id=swipe.id, product_id=swipe.product_id, direction=swipe.direction,
        created_at=swipe.created_at, added_to_wishlist=added_to_wishlist,
    )


@router.get("/history", response_model=list[SwipeHistoryItem])
def swipe_history(
    direction: str | None = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = (
        select(Swipe, Product)
        .join(Product, Product.id == Swipe.product_id)
        .where(Swipe.user_id == user.id)
        .order_by(Swipe.created_at.desc())
        .limit(limit)
    )
    if direction:
        q = q.where(Swipe.direction == direction)
    rows = db.execute(q).all()
    return [
        SwipeHistoryItem(
            id=s.id, product_id=p.id, direction=s.direction, title=p.title, brand=p.brand,
            price=p.price, image_url=p.image_url, marketplace=p.marketplace,
            external_url=p.external_url, created_at=s.created_at,
        )
        for s, p in rows
    ]
