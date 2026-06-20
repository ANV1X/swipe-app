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


def product_to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id, title=p.title, brand=p.brand, price=p.price, price_old=p.price_old,
        image_url=p.image_url, marketplace=p.marketplace, external_url=p.external_url,
        category=p.category, gender=p.gender, discount_pct=p.discount_pct,
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
