from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from db.session import get_db
from db.models import Product, Swipe
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class DealOut(BaseModel):
    id: str
    title: str
    brand: str | None
    price: int
    price_old: int | None
    image_url: str
    marketplace: str
    external_url: str
    category: str
    discount_pct: int

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[DealOut])
def get_deals(
    for_you: bool = Query(False),
    category: str | None = Query(None),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Товары со скидкой. for_you=true — только те категории что лайкал."""
    user_id = str(user["id"])

    q = select(Product).where(Product.price_old.isnot(None))

    if category:
        q = q.where(Product.category == category)

    if for_you:
        # Категории которые пользователь лайкал
        liked = db.execute(
            select(Product.category)
            .join(Swipe, Swipe.product_id == Product.id)
            .where(Swipe.user_id == user_id, Swipe.direction == "right")
            .distinct()
        ).scalars().all()
        if liked:
            q = q.where(Product.category.in_(liked))

    products = db.scalars(q).all()

    result = []
    for p in products:
        if not p.price_old:
            continue
        discount = round((1 - p.price / p.price_old) * 100)
        if discount < 5:  # только реальные скидки
            continue
        result.append(DealOut(
            id=p.id,
            title=p.title,
            brand=p.brand,
            price=p.price,
            price_old=p.price_old,
            image_url=p.image_url,
            marketplace=p.marketplace,
            external_url=p.external_url,
            category=p.category,
            discount_pct=discount,
        ))

    # Сортируем по размеру скидки
    result.sort(key=lambda x: x.discount_pct, reverse=True)
    return result
