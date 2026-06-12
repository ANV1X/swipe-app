from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from db.session import get_db
from db.models import Swipe, Product
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class SwipeHistoryItem(BaseModel):
    product_id: str
    direction: str
    title: str
    brand: str | None
    price: int
    image_url: str
    marketplace: str
    external_url: str
    swiped_at: datetime

@router.get("/", response_model=list[SwipeHistoryItem])
def get_history(
    direction: str | None = Query(None),
    limit: int = Query(50, le=200),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(user["id"])
    q = (
        select(Swipe, Product)
        .join(Product, Product.id == Swipe.product_id)
        .where(Swipe.user_id == user_id)
        .order_by(Swipe.created_at.desc())
        .limit(limit)
    )
    if direction:
        q = q.where(Swipe.direction == direction)
    rows = db.execute(q).all()
    return [
        SwipeHistoryItem(
            product_id=p.id, direction=s.direction,
            title=p.title, brand=p.brand, price=p.price,
            image_url=p.image_url, marketplace=p.marketplace,
            external_url=p.external_url, swiped_at=s.created_at,
        )
        for s, p in rows
    ]
