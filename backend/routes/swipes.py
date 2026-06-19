from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Swipe, Product, WishlistItem
from app.schemas import SwipeCreate
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/swipe", tags=["swipes"])

@router.post("/")
def swipe_product(
    swipe_data: SwipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == swipe_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.query(Swipe).filter(
        Swipe.user_id == current_user.id,
        Swipe.product_id == swipe_data.product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already swiped this product")
    swipe = Swipe(
        user_id=current_user.id,
        product_id=swipe_data.product_id,
        direction=swipe_data.direction
    )
    db.add(swipe)
    if swipe_data.direction == "right":
        wishlist_item = WishlistItem(
            user_id=current_user.id,
            product_id=swipe_data.product_id
        )
        db.add(wishlist_item)
    db.commit()
    return {"status": "ok", "direction": swipe_data.direction}