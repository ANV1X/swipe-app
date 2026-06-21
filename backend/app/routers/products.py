from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Product, User, Wishlist, PriceHistory, Swipe
from app.schemas import ProductOut
from app.utils import product_to_out, BUDGET_TO_MAX_PRICE, build_liked_profile, personalization_score

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[ProductOut])
def list_products(
    category: str | None = None,
    gender: str | None = None,
    style: str | None = None,
    color: str | None = None,
    price_max: int | None = None,
    exclude_swiped: bool = False,
    personalized: bool = True,
    limit: int = Query(default=100, le=300),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Product)
    if category and category not in ("Все", "all"):
        q = q.where(Product.category == category)
    if gender:
        q = q.where((Product.gender == gender) | (Product.gender == "unisex"))
    if style:
        q = q.where(Product.style == style)
    if color:
        q = q.where(Product.color == color)
    if price_max:
        q = q.where(Product.price <= price_max)
    if exclude_swiped:
        swiped_ids = select(Swipe.product_id).where(Swipe.user_id == user.id)
        q = q.where(Product.id.not_in(swiped_ids))

    # без персонализации сортируем по дате (предсказуемо, например для подбора в админке)
    if not personalized:
        products = db.scalars(q.order_by(Product.created_at.desc()).limit(limit)).all()
        return [product_to_out(p) for p in products]

    # с персонализацией — берём кандидатов с запасом и сортируем по релевантности
    candidates = db.scalars(q.order_by(Product.created_at.desc()).limit(max(limit * 3, 150))).all()
    liked = build_liked_profile(db, user.id)
    scored = sorted(
        candidates,
        key=lambda p: (personalization_score(user, p, liked), p.created_at),
        reverse=True,
    )
    return [product_to_out(p) for p in scored[:limit]]


@router.get("/deals", response_model=list[ProductOut])
def list_deals(
    category: str | None = None,
    for_you: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Product).where(Product.discount_pct.is_not(None)).order_by(Product.discount_pct.desc())
    if category and category not in ("Для вас", "all"):
        q = q.where(Product.category == category)
    if for_you and user.pref_gender:
        q = q.where((Product.gender == user.pref_gender) | (Product.gender == "unisex"))
    products = db.scalars(q.limit(100)).all()
    return [product_to_out(p) for p in products]


@router.get("/foryou", response_model=list[ProductOut])
def for_you(
    limit: int = 6,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Product)
    if user.pref_gender and user.pref_gender != "all":
        q = q.where((Product.gender == user.pref_gender) | (Product.gender == "unisex"))
    if user.pref_budget:
        max_price = BUDGET_TO_MAX_PRICE.get(user.pref_budget)
        if max_price:
            q = q.where(Product.price <= max_price)

    candidates = db.scalars(q.order_by(Product.created_at.desc()).limit(60)).all()
    if not candidates:
        candidates = db.scalars(select(Product).order_by(Product.created_at.desc()).limit(60)).all()

    liked = build_liked_profile(db, user.id)
    scored = sorted(candidates, key=lambda p: personalization_score(user, p, liked), reverse=True)
    return [product_to_out(p) for p in scored[:limit]]


@router.get("/foryou/meta")
def for_you_meta(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Доп. данные для экрана «Для тебя»: сколько товаров подходит под вкус."""
    q = select(func.count()).select_from(Product)
    if user.pref_gender and user.pref_gender != "all":
        q = q.where((Product.gender == user.pref_gender) | (Product.gender == "unisex"))
    match_count = db.scalar(q) or 0
    liked = db.scalar(
        select(func.count()).select_from(Wishlist).where(Wishlist.user_id == user.id)
    ) or 0
    match_pct = min(99, 70 + liked) if liked else 90
    return {"match_count": match_count, "match_pct": match_pct}


@router.get("/{product_id}/price-history")
def price_history(product_id: str, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    rows = db.scalars(
        select(PriceHistory).where(PriceHistory.product_id == product_id).order_by(PriceHistory.created_at)
    ).all()
    points = [{"date": r.created_at.date().isoformat(), "price": r.price} for r in rows]
    if not points:
        points = [{"date": product.created_at.date().isoformat(), "price": product.price}]
    prices = [p["price"] for p in points]
    return {
        "product_id": product.id,
        "current_price": product.price,
        "min_price": min(prices),
        "max_price": max(prices),
        "points": points,
    }
