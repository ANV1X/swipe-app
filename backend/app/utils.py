import json

from app.config import Config
from app.models import Product, User
from app.schemas import ProductOut, UserOut

BUDGET_TO_MAX_PRICE = {
    "budget": 3000,
    "mid": 8000,
    "high": 20000,
    "luxury": None,
}

# Соответствие id бренда в анкете онбординга и реального текста в Product.brand
BRAND_ID_TO_LABEL = {
    "zara": "Zara", "hm": "H&M", "uniqlo": "Uniqlo", "cos": "COS", "mango": "Mango",
    "nb": "New Balance", "nike": "Nike", "adidas": "Adidas", "reserved": "Reserved",
    "pull": "Pull&Bear", "wb": "Wildberries", "lamoda": "Lamoda",
}


def build_liked_profile(db, user_id: str) -> dict:
    """Считает, какие категории/стили/цвета/маркетплейсы/бренды пользователь
    чаще лайкал — используется для персонализации ленты."""
    from collections import Counter
    from sqlalchemy import select
    from app.models import Swipe

    rows = db.execute(
        select(Product).join(Swipe, Swipe.product_id == Product.id)
        .where(Swipe.user_id == user_id, Swipe.direction == "like")
    ).scalars().all()

    return {
        "category": Counter(p.category for p in rows if p.category),
        "style": Counter(p.style for p in rows if p.style),
        "color": Counter(p.color for p in rows if p.color),
        "marketplace": Counter(p.marketplace for p in rows if p.marketplace),
        "brand": Counter(p.brand for p in rows if p.brand),
    }


def personalization_score(user: User, product: Product, liked: dict) -> int:
    """Скор релевантности товара пользователю: вкусы из онбординга + история лайков."""
    score = 0
    pref_styles = loads_list(user.pref_styles)
    pref_colors = loads_list(user.pref_colors)
    pref_brand_labels = {BRAND_ID_TO_LABEL.get(b, b) for b in loads_list(user.pref_brands)}

    if product.style and product.style in pref_styles:
        score += 2
    if product.color and product.color in pref_colors:
        score += 2
    if product.brand and product.brand in pref_brand_labels:
        score += 2

    score += liked["category"].get(product.category, 0) * 2
    score += liked["style"].get(product.style, 0) * 3
    score += liked["color"].get(product.color, 0) * 2
    score += liked["marketplace"].get(product.marketplace, 0)
    score += liked["brand"].get(product.brand, 0) * 2
    return score


def relative_time_ru(dt) -> str:
    from datetime import datetime
    diff = datetime.utcnow() - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "только что"
    minutes = int(seconds // 60)
    if minutes < 60:
        return f"{minutes} мин назад"
    hours = int(seconds // 3600)
    if hours < 24:
        return f"{hours} ч назад"
    days = int(seconds // 86400)
    if days < 30:
        return f"{days} дн назад"
    return dt.strftime("%d.%m.%Y")


def product_to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id, title=p.title, brand=p.brand, price=p.price, price_old=p.price_old,
        image_url=p.image_url, marketplace=p.marketplace, external_url=p.external_url,
        category=p.category, gender=p.gender, style=p.style, color=p.color,
        discount_pct=p.discount_pct,
    )


def loads_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        val = json.loads(raw)
        return val if isinstance(val, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def dumps_list(val: list[str] | None) -> str | None:
    if val is None:
        return None
    return json.dumps(val, ensure_ascii=False)


def user_to_out(u: User) -> UserOut:
    is_admin = bool(u.is_admin) or (u.telegram_id is not None and u.telegram_id in Config.ADMIN_IDS)
    return UserOut(
        id=u.id, telegram_id=u.telegram_id, username=u.username, first_name=u.first_name,
        is_admin=is_admin,
        onboarding_done=u.onboarding_done,
        pref_gender=u.pref_gender,
        pref_styles=loads_list(u.pref_styles),
        pref_colors=loads_list(u.pref_colors),
        pref_brands=loads_list(u.pref_brands),
        pref_budget=u.pref_budget,
        notif_price_drop=u.notif_price_drop,
        notif_new_in_collection=u.notif_new_in_collection,
        notif_friend_activity=u.notif_friend_activity,
        notif_battles=u.notif_battles,
        referral_code=u.referral_code,
    )
