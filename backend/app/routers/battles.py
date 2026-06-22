from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    Battle, BattleVote, BattleSubmission, Collection, CollectionItem, Product, User, Notification
)
from app.schemas import (
    BattleOut, BattleVoteIn, BattleCreate, BattleSubmissionIn, BattleSubmissionOut,
    BattleCollectionSide, PRIZE_PRESETS,
)

router = APIRouter(prefix="/battles", tags=["battles"])


def _collection_side(db: Session, collection_id: str) -> BattleCollectionSide | None:
    c = db.get(Collection, collection_id)
    if not c:
        return None
    items = db.scalars(
        select(Product).join(CollectionItem, CollectionItem.product_id == Product.id)
        .where(CollectionItem.collection_id == collection_id).limit(4)
    ).all()
    items_count = db.scalar(
        select(func.count()).select_from(CollectionItem).where(CollectionItem.collection_id == collection_id)
    ) or 0
    cover = c.cover_image or (items[0].image_url if items else None)
    return BattleCollectionSide(
        id=c.id, name=c.name, cover_image=cover, author_name=c.author_name,
        items_count=items_count, preview_images=[i.image_url for i in items],
    )


def _winner(b: Battle) -> str | None:
    if b.active:
        return None
    if b.votes_a == b.votes_b:
        return "tie"
    return "a" if b.votes_a > b.votes_b else "b"


def _to_out(db: Session, b: Battle, my_vote: str | None) -> BattleOut | None:
    side_a = _collection_side(db, b.collection_a_id)
    side_b = _collection_side(db, b.collection_b_id)
    if not side_a or not side_b:
        return None
    return BattleOut(
        id=b.id, active=b.active, votes_a=b.votes_a, votes_b=b.votes_b,
        prize_emoji=b.prize_emoji, prize_title=b.prize_title, prize_type=b.prize_type or "none",
        created_at=b.created_at, collection_a=side_a, collection_b=side_b,
        my_vote=my_vote, winner=_winner(b),
    )


@router.get("/active", response_model=BattleOut | None)
def get_active_battle(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    battle = db.scalar(select(Battle).where(Battle.active.is_(True)).order_by(Battle.created_at.desc()))
    if not battle:
        return None
    vote = db.scalar(
        select(BattleVote).where(BattleVote.battle_id == battle.id, BattleVote.user_id == user.id)
    )
    return _to_out(db, battle, vote.choice if vote else None)


@router.get("/history", response_model=list[BattleOut])
def get_battle_history(
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Сетка прошедших и текущих батлов — для красивого экрана со всеми сражениями."""
    battles = db.scalars(select(Battle).order_by(Battle.created_at.desc()).limit(limit)).all()
    my_votes = {
        v.battle_id: v.choice for v in db.scalars(
            select(BattleVote).where(BattleVote.user_id == user.id)
        ).all()
    }
    out = []
    for b in battles:
        item = _to_out(db, b, my_votes.get(b.id))
        if item:
            out.append(item)
    return out


@router.get("/prizes")
def get_prize_presets():
    return PRIZE_PRESETS


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

    out = _to_out(db, battle, body.choice)
    if not out:
        raise HTTPException(status_code=404, detail="Collection in battle was deleted")
    return out


@router.post("/", response_model=BattleOut)
def create_battle(body: BattleCreate, db: Session = Depends(get_db)):
    a = db.get(Collection, body.collection_a_id)
    b = db.get(Collection, body.collection_b_id)
    if not a or not b:
        raise HTTPException(status_code=404, detail="Collection not found")
    # деактивируем предыдущий батл, чтобы на экране всегда был один активный
    db.execute(Battle.__table__.update().where(Battle.active.is_(True)).values(active=False))
    battle = Battle(
        collection_a_id=body.collection_a_id, collection_b_id=body.collection_b_id,
        prize_title=body.prize_title, prize_emoji=body.prize_emoji, prize_type=body.prize_type, active=True,
    )
    db.add(battle)
    db.commit()
    db.refresh(battle)
    out = _to_out(db, battle, None)
    if not out:
        raise HTTPException(status_code=500, detail="Failed to build battle")
    return out


@router.post("/submit", response_model=BattleSubmissionOut)
def submit_collection(
    body: BattleSubmissionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Пользователь предлагает свою коллекцию для батла. Если в очереди уже
    есть чья-то ещё коллекция — сразу создаём батл (мэтчим заявки)."""
    collection = db.get(Collection, body.collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if collection.author_id != user.id:
        raise HTTPException(status_code=403, detail="You can only submit your own collections")

    already = db.scalar(
        select(BattleSubmission).where(
            BattleSubmission.collection_id == body.collection_id, BattleSubmission.status == "pending"
        )
    )
    if already:
        return BattleSubmissionOut(status="waiting")

    opponent = db.scalar(
        select(BattleSubmission)
        .where(BattleSubmission.status == "pending", BattleSubmission.user_id != user.id)
        .order_by(BattleSubmission.created_at)
    )

    my_submission = BattleSubmission(collection_id=body.collection_id, user_id=user.id, status="pending")
    db.add(my_submission)
    db.flush()

    if not opponent:
        db.commit()
        return BattleSubmissionOut(status="waiting")

    import random
    preset = random.choice([p for p in PRIZE_PRESETS if p["type"] != "none"])
    battle = Battle(
        collection_a_id=opponent.collection_id, collection_b_id=body.collection_id,
        prize_emoji=preset["emoji"], prize_title=preset["default_title"], prize_type=preset["type"],
        active=True,
    )
    # деактивируем предыдущий батл, чтобы на экране всегда был один активный
    db.execute(
        Battle.__table__.update().where(Battle.active.is_(True)).values(active=False)
    )
    db.add(battle)
    db.flush()

    opponent.status = "matched"
    opponent.battle_id = battle.id
    my_submission.status = "matched"
    my_submission.battle_id = battle.id

    opponent_user = db.get(User, opponent.user_id)
    if opponent_user and opponent_user.notif_battles:
        db.add(Notification(
            user_id=opponent_user.id, type="battle_matched",
            title="Ваш батл начался!", collection_id=opponent.collection_id, battle_id=battle.id,
            body=f"Коллекция «{collection.name}» бросает вызов вашей. Голосуем!",
        ))
    if user.notif_battles:
        db.add(Notification(
            user_id=user.id, type="battle_matched",
            title="Ваш батл начался!", collection_id=body.collection_id, battle_id=battle.id,
            body="Соперник найден — ваша коллекция уже участвует в батле!",
        ))

    db.commit()
    return BattleSubmissionOut(status="matched", battle_id=battle.id)


@router.delete("/submit/{collection_id}")
def cancel_submission(
    collection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    sub = db.scalar(
        select(BattleSubmission).where(
            BattleSubmission.collection_id == collection_id,
            BattleSubmission.user_id == user.id,
            BattleSubmission.status == "pending",
        )
    )
    if sub:
        db.delete(sub)
        db.commit()
    return {"ok": True}
