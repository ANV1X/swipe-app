from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from db.session import get_db
from db.models import Product, Swipe, PriceHistory
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ProductOut(BaseModel):
    id: str
    title: str
    brand: str | None
    price: int
    price_old: int | None
    image_url: str
    marketplace: str
    external_url: str
    category: str
    gender: str | None
    model_config = {"from_attributes": True}


class PricePointOut(BaseModel):
    price: int
    date: datetime


@router.get("/", response_model=list[ProductOut])
def get_products(
    category: str | None = Query(None),
    price_max: int | None = Query(None),
    gender: str | None = Query(None),
    limit: int = Query(20, le=50),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(user["id"])
    swiped_ids = db.scalars(
        select(Swipe.product_id).where(Swipe.user_id == user_id)
    ).all()

    q = select(Product).where(Product.id.notin_(swiped_ids))
    if category:
        q = q.where(Product.category == category)
    if price_max:
        q = q.where(Product.price <= price_max * 100)
    if gender:
        q = q.where(Product.gender.in_([gender, "unisex"]))

    return db.scalars(q.limit(limit)).all()


@router.get("/{product_id}/price-history", response_model=list[PricePointOut])
def get_price_history(
    product_id: str,
    db: Session = Depends(get_db),
):
    """График цены за последние 90 дней."""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=90)

    history = db.scalars(
        select(PriceHistory)
        .where(
            PriceHistory.product_id == product_id,
            PriceHistory.created_at >= cutoff
        )
        .order_by(PriceHistory.created_at.asc())
    ).all()

    # Добавляем текущую цену как последнюю точку
    product = db.get(Product, product_id)
    result = [PricePointOut(price=h.price, date=h.created_at) for h in history]
    if product:
        result.append(PricePointOut(price=product.price, date=datetime.utcnow()))

    return result
