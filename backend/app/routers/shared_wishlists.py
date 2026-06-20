from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    SharedWishlist, SharedWishlistMember, SharedWishlistItem, Product, User
)
from app.schemas import SharedWishlistCreate, SharedWishlistOut, SharedMemberOut, SharedItemOut

router = APIRouter(prefix="/shared-wishlists", tags=["shared-wishlists"])


def _build_out(db: Session, sw: SharedWishlist) -> SharedWishlistOut:
    members = db.scalars(
        select(SharedWishlistMember).where(SharedWishlistMember.shared_wishlist_id == sw.id)
    ).all()
    items = db.scalars(
        select(SharedWishlistItem).where(SharedWishlistItem.shared_wishlist_id == sw.id)
        .order_by(SharedWishlistItem.created_at.desc())
    ).all()

    member_out = []
    for m in members:
        u = db.get(User, m.user_id)
        member_out.append(SharedMemberOut(
            user_id=m.user_id, first_name=u.first_name if u else "Гость", joined_at=m.joined_at
        ))

    item_out = []
    preview_images = []
    for i in items:
        p = db.get(Product, i.product_id)
        if not p:
            continue
        adder = db.get(User, i.added_by)
        item_out.append(SharedItemOut(
            product_id=p.id, title=p.title, brand=p.brand, price=p.price, price_old=p.price_old,
            image_url=p.image_url, marketplace=p.marketplace, external_url=p.external_url,
            added_by=i.added_by, added_by_name=adder.first_name if adder else "Гость",
            added_at=i.created_at,
        ))
        if len(preview_images) < 3:
            preview_images.append(p.image_url)

    return SharedWishlistOut(
        id=sw.id, name=sw.name, owner_id=sw.owner_id,
        invite_link=f"/shared/{sw.id}",
        member_count=len(member_out), product_count=len(item_out),
        preview_images=preview_images,
        members=member_out, items=item_out, created_at=sw.created_at,
    )


@router.get("/", response_model=list[SharedWishlistOut])
def my_shared_wishlists(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership_ids = db.scalars(
        select(SharedWishlistMember.shared_wishlist_id).where(SharedWishlistMember.user_id == user.id)
    ).all()
    out = []
    for wid in membership_ids:
        sw = db.get(SharedWishlist, wid)
        if sw:
            out.append(_build_out(db, sw))
    out.sort(key=lambda x: x.created_at, reverse=True)
    return out


@router.post("/", response_model=SharedWishlistOut)
def create_shared_wishlist(
    body: SharedWishlistCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    sw = SharedWishlist(name=body.name, owner_id=user.id)
    db.add(sw)
    db.flush()
    db.add(SharedWishlistMember(shared_wishlist_id=sw.id, user_id=user.id))
    db.commit()
    db.refresh(sw)
    return _build_out(db, sw)


@router.get("/{wishlist_id}", response_model=SharedWishlistOut)
def get_shared_wishlist(wishlist_id: str, db: Session = Depends(get_db)):
    sw = db.get(SharedWishlist, wishlist_id)
    if not sw:
        raise HTTPException(status_code=404, detail="Not found")
    return _build_out(db, sw)


@router.post("/{wishlist_id}/join", response_model=SharedWishlistOut)
def join_shared_wishlist(
    wishlist_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    sw = db.get(SharedWishlist, wishlist_id)
    if not sw:
        raise HTTPException(status_code=404, detail="Not found")
    existing = db.scalar(
        select(SharedWishlistMember).where(
            SharedWishlistMember.shared_wishlist_id == wishlist_id,
            SharedWishlistMember.user_id == user.id,
        )
    )
    if not existing:
        db.add(SharedWishlistMember(shared_wishlist_id=wishlist_id, user_id=user.id))
        db.commit()
    return _build_out(db, sw)


@router.post("/{wishlist_id}/items/{product_id}", response_model=SharedWishlistOut)
def add_item(
    wishlist_id: str, product_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    sw = db.get(SharedWishlist, wishlist_id)
    if not sw:
        raise HTTPException(status_code=404, detail="Not found")
    is_member = db.scalar(
        select(SharedWishlistMember).where(
            SharedWishlistMember.shared_wishlist_id == wishlist_id,
            SharedWishlistMember.user_id == user.id,
        )
    )
    if not is_member:
        db.add(SharedWishlistMember(shared_wishlist_id=wishlist_id, user_id=user.id))
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.scalar(
        select(SharedWishlistItem).where(
            SharedWishlistItem.shared_wishlist_id == wishlist_id,
            SharedWishlistItem.product_id == product_id,
            SharedWishlistItem.added_by == user.id,
        )
    )
    if not existing:
        db.add(SharedWishlistItem(shared_wishlist_id=wishlist_id, product_id=product_id, added_by=user.id))
    db.commit()
    return _build_out(db, sw)


@router.delete("/{wishlist_id}/items/{product_id}")
def remove_item(
    wishlist_id: str, product_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    item = db.scalar(
        select(SharedWishlistItem).where(
            SharedWishlistItem.shared_wishlist_id == wishlist_id,
            SharedWishlistItem.product_id == product_id,
            SharedWishlistItem.added_by == user.id,
        )
    )
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}
