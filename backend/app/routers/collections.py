from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, is_admin_user
from app.models import Collection, CollectionItem, CollectionSubscription, Product, User, Notification
from app.schemas import CollectionOut, CollectionCreate, ProductOut
from app.utils import product_to_out

router = APIRouter(prefix="/collections", tags=["collections"])


def _to_out(c: Collection, items_count: int, is_subscribed: bool) -> CollectionOut:
    return CollectionOut(
        id=c.id, name=c.name, author_id=c.author_id, author_name=c.author_name,
        author_handle=c.author_handle,
        author_avatar=c.author_avatar, cover_image=c.cover_image,
        subscribers_count=c.subscribers_count, items_count=items_count,
        is_subscribed=is_subscribed, is_official=c.is_official, created_at=c.created_at,
    )


@router.get("/", response_model=list[CollectionOut])
def list_collections(
    tab: str = "popular",  # popular | new | subscribed | official | community
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    my_subs = set(
        db.scalars(
            select(CollectionSubscription.collection_id).where(CollectionSubscription.user_id == user.id)
        ).all()
    )

    q = select(Collection)
    if tab == "subscribed":
        if not my_subs:
            return []
        q = q.where(Collection.id.in_(my_subs))
    elif tab == "official":
        q = q.where(Collection.is_official.is_(True))
    elif tab == "community":
        q = q.where(Collection.is_official.is_(False))

    if tab == "new":
        q = q.order_by(Collection.created_at.desc())
    else:
        q = q.order_by(Collection.subscribers_count.desc())

    collections = db.scalars(q).all()
    out = []
    for c in collections:
        items_count = db.scalar(
            select(func.count()).select_from(CollectionItem).where(CollectionItem.collection_id == c.id)
        ) or 0
        out.append(_to_out(c, items_count, c.id in my_subs))
    return out


@router.get("/mine", response_model=list[CollectionOut])
def list_my_collections(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    collections = db.scalars(
        select(Collection).where(Collection.author_id == user.id).order_by(Collection.created_at.desc())
    ).all()
    out = []
    for c in collections:
        items_count = db.scalar(
            select(func.count()).select_from(CollectionItem).where(CollectionItem.collection_id == c.id)
        ) or 0
        out.append(_to_out(c, items_count, True))
    return out


@router.get("/{collection_id}/items", response_model=list[ProductOut])
def collection_items(collection_id: str, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Product)
        .join(CollectionItem, CollectionItem.product_id == Product.id)
        .where(CollectionItem.collection_id == collection_id)
    ).scalars().all()
    return [product_to_out(p) for p in rows]


@router.post("/{collection_id}/items/{product_id}", response_model=list[ProductOut])
def add_collection_item(
    collection_id: str, product_id: str,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    c = db.get(Collection, collection_id)
    if not c:
        raise HTTPException(status_code=404, detail="Collection not found")
    if c.author_id != user.id:
        raise HTTPException(status_code=403, detail="Only the collection author can add items")
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.scalar(
        select(CollectionItem).where(
            CollectionItem.collection_id == collection_id, CollectionItem.product_id == product_id
        )
    )
    if not existing:
        db.add(CollectionItem(collection_id=collection_id, product_id=product_id))

        # Уведомляем подписчиков о новом товаре в коллекции
        subscribers = db.scalars(
            select(CollectionSubscription).where(CollectionSubscription.collection_id == collection_id)
        ).all()
        for sub in subscribers:
            subscriber = db.get(User, sub.user_id)
            if subscriber and subscriber.notif_new_in_collection:
                db.add(Notification(
                    user_id=subscriber.id, type="new_in_collection", product_id=product.id,
                    collection_id=c.id,
                    title="Новинка в коллекции",
                    body=f"В «{c.name}» добавили: {product.title}",
                ))
        db.commit()

    rows = db.execute(
        select(Product).join(CollectionItem, CollectionItem.product_id == Product.id)
        .where(CollectionItem.collection_id == collection_id)
    ).scalars().all()
    return [product_to_out(p) for p in rows]


@router.delete("/{collection_id}/items/{product_id}", response_model=list[ProductOut])
def remove_collection_item(
    collection_id: str, product_id: str,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    c = db.get(Collection, collection_id)
    if not c:
        raise HTTPException(status_code=404, detail="Collection not found")
    if c.author_id != user.id:
        raise HTTPException(status_code=403, detail="Only the collection author can remove items")

    item = db.scalar(
        select(CollectionItem).where(
            CollectionItem.collection_id == collection_id, CollectionItem.product_id == product_id
        )
    )
    if item:
        db.delete(item)
        db.commit()

    rows = db.execute(
        select(Product).join(CollectionItem, CollectionItem.product_id == Product.id)
        .where(CollectionItem.collection_id == collection_id)
    ).scalars().all()
    return [product_to_out(p) for p in rows]


@router.post("/", response_model=CollectionOut)
def create_collection(
    body: CollectionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    c = Collection(
        name=body.name,
        author_id=user.id,
        author_name=user.first_name or "Гость",
        author_handle=body.author_handle or user.username,
        cover_image=body.cover_image,
        subscribers_count=0,
        is_official=is_admin_user(user),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_out(c, 0, False)


@router.post("/{collection_id}/subscribe", response_model=CollectionOut)
def subscribe(collection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.get(Collection, collection_id)
    if not c:
        raise HTTPException(status_code=404, detail="Collection not found")
    existing = db.scalar(
        select(CollectionSubscription).where(
            CollectionSubscription.user_id == user.id,
            CollectionSubscription.collection_id == collection_id,
        )
    )
    if not existing:
        db.add(CollectionSubscription(user_id=user.id, collection_id=collection_id))
        c.subscribers_count = (c.subscribers_count or 0) + 1
        if user.notif_new_in_collection:
            items_now = db.scalar(
                select(func.count()).select_from(CollectionItem).where(CollectionItem.collection_id == c.id)
            ) or 0
            db.add(Notification(
                user_id=user.id, type="new_in_collection", collection_id=c.id,
                title="Подписка оформлена",
                body=f"Вы подписались на коллекцию «{c.name}» — {items_now} товаров уже внутри",
            ))
        db.commit()
        db.refresh(c)
    items_count = db.scalar(
        select(func.count()).select_from(CollectionItem).where(CollectionItem.collection_id == c.id)
    ) or 0
    return _to_out(c, items_count, True)


@router.delete("/{collection_id}/subscribe", response_model=CollectionOut)
def unsubscribe(collection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.get(Collection, collection_id)
    if not c:
        raise HTTPException(status_code=404, detail="Collection not found")
    existing = db.scalar(
        select(CollectionSubscription).where(
            CollectionSubscription.user_id == user.id,
            CollectionSubscription.collection_id == collection_id,
        )
    )
    if existing:
        db.delete(existing)
        c.subscribers_count = max(0, (c.subscribers_count or 0) - 1)
        db.commit()
        db.refresh(c)
    items_count = db.scalar(
        select(func.count()).select_from(CollectionItem).where(CollectionItem.collection_id == c.id)
    ) or 0
    return _to_out(c, items_count, False)
