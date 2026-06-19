import hmac
import hashlib
import json
from typing import Optional
from fastapi import HTTPException, Header, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.config import Config

def validate_telegram_init_data(init_data: str) -> dict:
    params = {}
    for part in init_data.split('&'):
        key, value = part.split('=')
        params[key] = value
    if 'hash' not in params:
        raise HTTPException(status_code=400, detail="No hash in initData")
    hash_str = params.pop('hash')
    data_check_string = '\n'.join([f"{k}={v}" for k, v in sorted(params.items())])
    secret_key = hmac.new(b"WebAppData", Config.BOT_TOKEN.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if expected_hash != hash_str:
        raise HTTPException(status_code=400, detail="Invalid initData hash")
    return params

async def get_current_user(
    x_init_data: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not x_init_data:
        raise HTTPException(status_code=401, detail="Missing X-Init-Data header")
    data = validate_telegram_init_data(x_init_data)
    user_data = json.loads(data.get('user', '{}'))
    if not user_data:
        raise HTTPException(status_code=400, detail="User data missing")
    telegram_id = user_data.get('id')
    if not telegram_id:
        raise HTTPException(status_code=400, detail="User id missing")
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(
            telegram_id=telegram_id,
            username=user_data.get('username'),
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name'),
            photo_url=user_data.get('photo_url')
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

async def get_current_user_dev(db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.telegram_id == 123456789).first()
    if not user:
        user = User(telegram_id=123456789, first_name="Dev", username="devuser")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user