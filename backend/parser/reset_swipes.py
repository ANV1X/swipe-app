"""Сбросить все свайпы (чтобы лента снова показывала товары). python parser/reset_swipes.py"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.session import SessionLocal
from db.models import Swipe, Wishlist

db = SessionLocal()
swipes = db.query(Swipe).delete()
wishlist = db.query(Wishlist).delete()
db.commit()
db.close()
print(f"✅ Свайпы сброшены. Лента снова полная.")
