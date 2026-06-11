"""Добавляет тестовую историю цен. python parser/seed_prices.py"""
import sys, os, random
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.session import SessionLocal
from db.models import PriceHistory, Product
from datetime import datetime, timedelta

db = SessionLocal()
products = db.query(Product).all()
added = 0

for product in products:
    # Генерируем 8 точек за последние 90 дней
    for i in range(8, 0, -1):
        days_ago = i * 10
        date = datetime.utcnow() - timedelta(days=days_ago)
        # Цена гуляет ±20% от текущей
        variation = random.uniform(0.85, 1.20)
        price = int(product.price * variation)
        # Округляем до сотен
        price = round(price / 100) * 100
        existing = db.query(PriceHistory).filter_by(
            product_id=product.id
        ).filter(PriceHistory.created_at >= date - timedelta(days=2),
                 PriceHistory.created_at <= date + timedelta(days=2)).first()
        if not existing:
            db.add(PriceHistory(product_id=product.id, price=price, created_at=date))
            added += 1

db.commit()
db.close()
print(f"✅ Добавлено {added} точек истории цен")
