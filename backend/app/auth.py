"""
Авторизация пользователей.

Поддерживаются два режима, и оба ведут на одну и ту же таблицу users:

1. Telegram Mini App — фронтенд присылает заголовок X-Init-Data с подписанной
   строкой initData. Мы проверяем HMAC-подпись через BOT_TOKEN и достаём
   telegram_id/username/first_name из неё.

2. Обычный браузер (например, превью на Vercel вне Telegram) — фронтенд
   генерирует случайный uuid и хранит его в localStorage, присылая его
   в заголовке X-Anon-Id. Мы используем этот uuid как id пользователя.

Если не пришёл ни один из заголовков, используется общий "гостевой"
пользователь (id="guest"), чтобы запросы не падали даже без какой-либо
настройки на фронтенде.
"""
import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import Config
from app.database import get_db
from app.models import User


def _validate_telegram_init_data(init_data: str) -> dict | None:
    if not init_data or not Config.BOT_TOKEN:
        return None
    try:
        pairs = dict(parse_qsl(init_data, strict_parsing=False))
    except ValueError:
        return None
    received_hash = pairs.pop("hash", None)
    if not received_hash:
        return None
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret_key = hmac.new(b"WebAppData", Config.BOT_TOKEN.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_hash, received_hash):
        return None
    user_raw = pairs.get("user")
    if not user_raw:
        return None
    try:
        return json.loads(user_raw)
    except (json.JSONDecodeError, TypeError):
        return None


def _get_or_create_user(
    db: Session,
    *,
    user_id: str,
    telegram_id: int | None = None,
    username: str | None = None,
    first_name: str | None = None,
) -> User:
    from datetime import datetime

    user = db.get(User, user_id)
    if user:
        user.last_seen_at = datetime.utcnow()
        if username:
            user.username = username
        if first_name:
            user.first_name = first_name
        db.commit()
        return user
    user = User(
        id=user_id,
        telegram_id=telegram_id,
        username=username,
        first_name=first_name or "Гость",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


async def get_current_user(
    x_init_data: str | None = Header(default=None, alias="X-Init-Data"),
    x_anon_id: str | None = Header(default=None, alias="X-Anon-Id"),
    db: Session = Depends(get_db),
) -> User:
    # 1) Telegram Mini App
    tg_user = _validate_telegram_init_data(x_init_data or "")
    if tg_user and tg_user.get("id"):
        user = _get_or_create_user(
            db,
            user_id=str(tg_user["id"]),
            telegram_id=tg_user["id"],
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name", "Гость"),
        )
        return user

    # 2) Анонимный пользователь браузера
    if x_anon_id:
        user = _get_or_create_user(db, user_id=x_anon_id, first_name="Гость")
        return user

    # 3) Фолбэк — общий гость (на случай прямых вызовов API/тестов)
    return _get_or_create_user(db, user_id="guest", first_name="Гость")


def is_admin_user(user: User) -> bool:
    return bool(user.is_admin) or (user.telegram_id is not None and user.telegram_id in Config.ADMIN_IDS)


def require_admin(user: User = Depends(get_current_user)) -> User:
    if is_admin_user(user):
        return user
    raise HTTPException(status_code=403, detail="Admin access required")
