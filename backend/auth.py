import hashlib
import hmac
import json
from urllib.parse import parse_qsl
from fastapi import Header, HTTPException
from dotenv import load_dotenv
import os

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN", "")


def validate_telegram_init_data(init_data: str) -> dict:
    if not init_data:
        print("DEBUG: initData пустой!")
        raise HTTPException(status_code=401, detail="Empty initData")

    params = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = params.pop("hash", None)

    if not received_hash:
        print(f"DEBUG: нет hash в initData. Params: {list(params.keys())}")
        raise HTTPException(status_code=401, detail="Missing hash")

    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )

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
        print(f"DEBUG: hash mismatch")
        print(f"  BOT_TOKEN (first 10 chars): {BOT_TOKEN[:10]}")
        print(f"  data_check_string: {data_check_string[:200]}")
        print(f"  expected: {expected_hash}")
        print(f"  received: {received_hash}")
        raise HTTPException(status_code=401, detail="Invalid signature")

    return params


def get_current_user(x_init_data: str = Header(..., alias="X-Init-Data")):
    data = validate_telegram_init_data(x_init_data)
    user = json.loads(data.get("user", "{}"))
    if not user:
        raise HTTPException(status_code=401, detail="No user in initData")
    return user


def get_current_user_dev():
    return {"id": 123456789, "first_name": "Dev", "username": "devuser"}
