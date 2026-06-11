import hashlib
import hmac
import json
from urllib.parse import parse_qsl
from fastapi import Header, HTTPException, Depends
from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")


def validate_telegram_init_data(init_data: str) -> dict:
    """
    Проверяет подпись initData от Telegram WebApp.
    Возвращает словарь с данными пользователя или кидает 401.
    """
    params = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = params.pop("hash", None)

    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash")

    # Строка для проверки: отсортированные пары key=value через \n
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )

    # secret_key = HMAC-SHA256("WebAppData", bot_token)
    secret_key = hmac.new(
        b"WebAppData",
        BOT_TOKEN.encode(),
        hashlib.sha256
    ).digest()

    expected_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid signature")

    return params


def get_current_user(x_init_data: str = Header(..., alias="X-Init-Data")):
    """
    FastAPI dependency. Достаёт и валидирует пользователя из заголовка.
    Фронт должен слать: X-Init-Data: window.Telegram.WebApp.initData
    """
    data = validate_telegram_init_data(x_init_data)
    user = json.loads(data.get("user", "{}"))
    if not user:
        raise HTTPException(status_code=401, detail="No user in initData")
    return user


# В dev-режиме можно использовать заглушку — раскомментируй если нужно тестировать без TG
def get_current_user_dev():
    return {"id": 123456789, "first_name": "Dev", "username": "devuser"}
