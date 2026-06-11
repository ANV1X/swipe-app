from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from db.session import get_db
from db.models import Swipe, Wishlist, User, Product
from auth import get_current_user_dev as get_current_user
from pydantic import BaseModel

router = APIRouter()


class SwipeIn(BaseModel):
    product_id: str
    direction: str      # "left" | "right"


@router.post("/")
def post_swipe(
    body: SwipeIn,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.direction not in ("left", "right"):
        raise HTTPException(status_code=400, detail="direction must be 'left' or 'right'")

    user_id = str(user["id"])

    # Убедимся что пользователь существует в БД
    db_user = db.get(User, user_id)
    if not db_user:
        db_user = User(
            id=user_id,
            first_name=user.get("first_name", ""),
            username=user.get("username"),
        )
        db.add(db_user)

    # Проверим что товар существует
    product = db.get(Product, body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        swipe = Swipe(
            user_id=user_id,
            product_id=body.product_id,
            direction=body.direction,
        )
        db.add(swipe)

        # Лайк — добавляем в вишлист
        if body.direction == "right":
            wishlist_item = Wishlist(
                user_id=user_id,
                product_id=body.product_id,
            )
            db.add(wishlist_item)

        db.commit()
    except IntegrityError:
        db.rollback()
        # Уже свайпнут — просто игнорируем
        pass

    return {"ok": True}
