from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SharedWishlist, User
from app.schemas import SharedWishlistCreate, SharedWishlist as SharedWishlistSchema
from app.auth import get_current_user

router = APIRouter(prefix="/shared", tags=["shared_wishlists"])

@router.post("/")
def share_wishlist(
    share_data: SharedWishlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    friend = db.query(User).filter(User.id == share_data.shared_with_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(SharedWishlist).filter(
        SharedWishlist.owner_id == current_user.id,
        SharedWishlist.shared_with_id == share_data.shared_with_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already shared")
    share = SharedWishlist(
        owner_id=current_user.id,
        shared_with_id=share_data.shared_with_id
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share

@router.get("/")
def get_shared_with_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(SharedWishlist).filter(SharedWishlist.shared_with_id == current_user.id).all()