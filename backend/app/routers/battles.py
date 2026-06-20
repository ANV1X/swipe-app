from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Battle, BattleVote, Product, User
from app.schemas import BattleOut, BattleVoteIn, BattleCreate
from app.utils import product_to_out

router = APIRouter(prefix="/battles", tags=["battles"])


def _to_out(b: Battle, pa: Product, pb: Product, my_vote: str | None) -> BattleOut:
    return BattleOut(
        id=b.id, active=b.active, votes_a=b.votes_a, votes_b=b.votes_b,
        created_at=b.created_at, product_a=product_to_out(pa), product_b=product_to_out(pb),
        my_vote=my_vote,
    )


@router.get("/active", response_model=BattleOut | None)
def get_active_battle(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    battle = db.scalar(select(Battle).where(Battle.active.is_(True)).order_by(Battle.created_at.desc()))
    if not battle:
        return None
    pa = db.get(Product, battle.product_a_id)
    pb = db.get(Product, battle.product_b_id)
    if not pa or not pb:
        return None
    vote = db.scalar(
        select(BattleVote).where(BattleVote.battle_id == battle.id, BattleVote.user_id == user.id)
    )
    return _to_out(battle, pa, pb, vote.choice if vote else None)


@router.post("/{battle_id}/vote", response_model=BattleOut)
def vote(
    battle_id: str, body: BattleVoteIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    battle = db.get(Battle, battle_id)
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    existing = db.scalar(
        select(BattleVote).where(BattleVote.battle_id == battle_id, BattleVote.user_id == user.id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already voted")

    db.add(BattleVote(battle_id=battle_id, user_id=user.id, choice=body.choice))
    if body.choice == "a":
        battle.votes_a = (battle.votes_a or 0) + 1
    else:
        battle.votes_b = (battle.votes_b or 0) + 1
    db.commit()
    db.refresh(battle)

    pa = db.get(Product, battle.product_a_id)
    pb = db.get(Product, battle.product_b_id)
    return _to_out(battle, pa, pb, body.choice)


@router.post("/", response_model=BattleOut)
def create_battle(body: BattleCreate, db: Session = Depends(get_db)):
    pa = db.get(Product, body.product_a_id)
    pb = db.get(Product, body.product_b_id)
    if not pa or not pb:
        raise HTTPException(status_code=404, detail="Product not found")
    battle = Battle(product_a_id=body.product_a_id, product_b_id=body.product_b_id, active=True)
    db.add(battle)
    db.commit()
    db.refresh(battle)
    return _to_out(battle, pa, pb, None)
