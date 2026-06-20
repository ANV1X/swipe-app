from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Referral
from app.schemas import UserOut, UserUpdate, ReferralRegister
from app.utils import user_to_out, dumps_list

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return user_to_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    data = body.model_dump(exclude_unset=True)
    for field in ("pref_styles", "pref_colors", "pref_brands"):
        if field in data:
            data[field] = dumps_list(data[field])
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user_to_out(user)


@router.post("/me/referral")
def register_referral(
    body: ReferralRegister, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    referrer = db.scalar(select(User).where(User.referral_code == body.code))
    if not referrer or referrer.id == user.id:
        return {"ok": False}
    already = db.scalar(select(Referral).where(Referral.referred_user_id == user.id))
    if already:
        return {"ok": False}
    db.add(Referral(referrer_id=referrer.id, referred_user_id=user.id))
    user.referred_by = body.code
    db.commit()
    return {"ok": True}
