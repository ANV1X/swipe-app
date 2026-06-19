from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Battle, BattleEntry, Vote, User, Product, Notification
from app.schemas import BattleCreate, BattleEntryCreate, VoteCreate
from app.auth import get_current_user
from app.bot import send_notification

router = APIRouter(prefix="/battles", tags=["battles"])

@router.post("/")
def create_battle(
    battle_data: BattleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    battle = Battle(
        title=battle_data.title,
        description=battle_data.description,
        prize_description=battle_data.prize_description,
        prize_type=battle_data.prize_type,
        prize_value=battle_data.prize_value,
        status=battle_data.status,
        created_by=current_user.id
    )
    db.add(battle)
    db.commit()
    db.refresh(battle)
    return battle

@router.get("/active")
def get_active_battles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Battle).filter(Battle.status == "active").all()

@router.post("/{battle_id}/entries")
def add_entry(
    battle_id: int,
    entry_data: BattleEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle or battle.status != "active":
        raise HTTPException(status_code=400, detail="Battle not active")
    existing = db.query(BattleEntry).filter(
        BattleEntry.battle_id == battle_id,
        BattleEntry.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already participating")
    entry = BattleEntry(
        battle_id=battle_id,
        user_id=current_user.id,
        product_id=entry_data.product_id,
        outfit_items=entry_data.outfit_items,
        description=entry_data.description
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.post("/{battle_id}/vote")
def vote(
    battle_id: int,
    vote_data: VoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle or battle.status != "active":
        raise HTTPException(status_code=400, detail="Battle not active")
    entry = db.query(BattleEntry).filter(BattleEntry.id == vote_data.entry_id).first()
    if not entry or entry.battle_id != battle_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    existing = db.query(Vote).filter(
        Vote.battle_id == battle_id,
        Vote.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already voted in this battle")
    vote = Vote(
        battle_id=battle_id,
        entry_id=vote_data.entry_id,
        user_id=current_user.id
    )
    db.add(vote)
    entry.vote_count += 1
    db.commit()
    return {"status": "voted"}

@router.post("/{battle_id}/end")
async def end_battle(  # <-- сделали асинхронной
    battle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    if battle.created_by != current_user.id and not current_user.is_premium:
        raise HTTPException(status_code=403, detail="Not allowed")
    battle.status = "ended"
    battle.ended_at = datetime.utcnow()
    winner_entry = db.query(BattleEntry).filter(BattleEntry.battle_id == battle_id).order_by(BattleEntry.vote_count.desc()).first()
    if winner_entry:
        winner = winner_entry.user
        if battle.prize_type == "premium":
            winner.is_premium = True
        elif battle.prize_type == "stars":
            winner.stars_balance += battle.prize_value
        db.commit()
        notification = Notification(
            user_id=winner.id,
            type="battle_win",
            title="Вы победили в батле!",
            message=f"Поздравляем! Вы выиграли {battle.prize_description}",
            data={"battle_id": battle.id}
        )
        db.add(notification)
        db.commit()
        # Теперь await работает, т.к. функция асинхронная
        await send_notification(winner.telegram_id, notification.message)
    db.commit()
    return {"status": "battle ended", "winner_id": winner_entry.user_id if winner_entry else None}