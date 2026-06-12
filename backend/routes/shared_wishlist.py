from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from db.session import get_db
from db.models import (
    SharedWishlist, SharedWishlistMember, SharedWishlistItem,
    User, Product
)
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class SharedWishlistCreate(BaseModel):
    name: str = "Общий вишлист"

class SharedItemOut(BaseModel):
    product_id: str
    title: str
    brand: str | None
    price: int
    price_old: int | None
    image_url: str
    marketplace: str
    external_url: str
    added_by: str           # user_id кто добавил
    added_by_name: str
    added_at: datetime

class MemberOut(BaseModel):
    user_id: str
    first_name: str
    joined_at: datetime

class SharedWishlistOut(BaseModel):
    id: str
    name: str
    owner_id: str
    invite_link: str
    members: list[MemberOut]
    items: list[SharedItemOut]
    created_at: datetime


def ensure_user(db: Session, user: dict) -> User:
    user_id = str(user["id"])
    db_user = db.get(User, user_id)
    if not db_user:
        db_user = User(
            id=user_id,
            first_name=user.get("first_name", ""),
            username=user.get("username"),
        )
        db.add(db_user)
        db.flush()
    return db_user


def build_invite_link(wishlist_id: str) -> str:
    # В проде замени YOUR_BOT_USERNAME на реальный юзернейм бота
    return f"https://t.me/YOUR_BOT_USERNAME?start=sw_{wishlist_id}"


def build_out(sw: SharedWishlist) -> SharedWishlistOut:
    members = [
        MemberOut(
            user_id=m.user_id,
            first_name=m.user.first_name,
            joined_at=m.joined_at,
        )
        for m in sw.members
    ]
    items = [
        SharedItemOut(
            product_id=i.product_id,
            title=i.product.title,
            brand=i.product.brand,
            price=i.product.price,
            price_old=i.product.price_old,
            image_url=i.product.image_url,
            marketplace=i.product.marketplace,
            external_url=i.product.external_url,
            added_by=i.added_by,
            added_by_name=i.user.first_name,
            added_at=i.created_at,
        )
        for i in sw.items
    ]
    return SharedWishlistOut(
        id=sw.id,
        name=sw.name,
        owner_id=sw.owner_id,
        invite_link=build_invite_link(sw.id),
        members=members,
        items=items,
        created_at=sw.created_at,
    )


@router.post("/", response_model=SharedWishlistOut)
def create_shared_wishlist(
    body: SharedWishlistCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user = ensure_user(db, user)
    sw = SharedWishlist(name=body.name, owner_id=db_user.id)
    db.add(sw)
    db.flush()
    member = SharedWishlistMember(shared_wishlist_id=sw.id, user_id=db_user.id)
    db.add(member)
    db.commit()
    db.refresh(sw)
    return build_out(sw)


@router.get("/", response_model=list[SharedWishlistOut])
def get_my_shared_wishlists(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(user["id"])
    memberships = db.scalars(
        select(SharedWishlistMember).where(SharedWishlistMember.user_id == user_id)
    ).all()
    result = []
    for m in memberships:
        sw = db.get(SharedWishlist, m.shared_wishlist_id)
        if sw:
            result.append(build_out(sw))
    return result


@router.post("/{wishlist_id}/join", response_model=SharedWishlistOut)
def join_shared_wishlist(
    wishlist_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sw = db.get(SharedWishlist, wishlist_id)
    if not sw:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    db_user = ensure_user(db, user)
    existing = db.scalar(
        select(SharedWishlistMember).where(
            SharedWishlistMember.shared_wishlist_id == wishlist_id,
            SharedWishlistMember.user_id == db_user.id,
        )
    )
    if not existing:
        db.add(SharedWishlistMember(shared_wishlist_id=wishlist_id, user_id=db_user.id))
        db.commit()
        db.refresh(sw)
    return build_out(sw)


@router.get("/{wishlist_id}", response_model=SharedWishlistOut)
def get_shared_wishlist(
    wishlist_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sw = db.get(SharedWishlist, wishlist_id)
    if not sw:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    return build_out(sw)


@router.post("/{wishlist_id}/items/{product_id}", response_model=SharedWishlistOut)
def add_item(
    wishlist_id: str,
    product_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sw = db.get(SharedWishlist, wishlist_id)
    if not sw:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    user_id = str(user["id"])
    is_member = db.scalar(
        select(SharedWishlistMember).where(
            SharedWishlistMember.shared_wishlist_id == wishlist_id,
            SharedWishlistMember.user_id == user_id,
        )
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member")
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.scalar(
        select(SharedWishlistItem).where(
            SharedWishlistItem.shared_wishlist_id == wishlist_id,
            SharedWishlistItem.product_id == product_id,
            SharedWishlistItem.added_by == user_id,
        )
    )
    if not existing:
        db.add(SharedWishlistItem(
            shared_wishlist_id=wishlist_id,
            product_id=product_id,
            added_by=user_id,
        ))
        db.commit()
        db.refresh(sw)
    return build_out(sw)


@router.delete("/{wishlist_id}/items/{product_id}")
def remove_item(
    wishlist_id: str,
    product_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(user["id"])
    item = db.scalar(
        select(SharedWishlistItem).where(
            SharedWishlistItem.shared_wishlist_id == wishlist_id,
            SharedWishlistItem.product_id == product_id,
            SharedWishlistItem.added_by == user_id,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
