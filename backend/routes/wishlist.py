from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from db.session import get_db
from db.models import Wishlist, Product
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class WishlistItemOut(BaseModel):
    id: str
    product_id: str
    title: str
    brand: str | None
    price: int
    price_old: int | None
    image_url: str
    marketplace: str
    external_url: str
    category: str
    added_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[WishlistItemOut])
def get_wishlist(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(user["id"])

    items = db.scalars(
        select(Wishlist)
        .where(Wishlist.user_id == user_id)
        .order_by(Wishlist.created_at.desc())
    ).all()

    result = []
    for item in items:
        p = item.product
        result.append(WishlistItemOut(
            id=item.id,
            product_id=p.id,
            title=p.title,
            brand=p.brand,
            price=p.price,
            price_old=p.price_old,
            image_url=p.image_url,
            marketplace=p.marketplace,
            external_url=p.external_url,
            category=p.category,
            added_at=item.created_at,
        ))
    return result


@router.delete("/{product_id}")
def remove_from_wishlist(
    product_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(user["id"])

    item = db.scalar(
        select(Wishlist)
        .where(Wishlist.user_id == user_id, Wishlist.product_id == product_id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Not in wishlist")

    db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/{product_id}/price-history")
def get_price_history(
    product_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """История цен товара за последние 90 дней."""
    from datetime import timedelta
    from db.models import PriceHistory, Product as ProductModel
    from sqlalchemy import select

    product = db.get(ProductModel, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    since = datetime.utcnow() - timedelta(days=90)
    history = db.scalars(
        select(PriceHistory)
        .where(PriceHistory.product_id == product_id,
               PriceHistory.created_at >= since)
        .order_by(PriceHistory.created_at)
    ).all()

    # Всегда добавляем текущую цену как последнюю точку
    points = [{"date": h.created_at.isoformat(), "price": h.price} for h in history]
    points.append({"date": datetime.utcnow().isoformat(), "price": product.price})

    return {
        "product_id": product_id,
        "current_price": product.price,
        "min_price": min(p["price"] for p in points),
        "max_price": max(p["price"] for p in points),
        "points": points,
    }
