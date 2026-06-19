from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import WishlistItem, Product
from app.schemas import WishlistItem as WishlistItemSchema
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

@router.get("/", response_model=list[WishlistItemSchema])
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(WishlistItem).filter(WishlistItem.user_id == current_user.id).all()
    return items

@router.delete("/{product_id}")
def remove_from_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    db.delete(item)
    db.commit()
    return {"status": "removed"}