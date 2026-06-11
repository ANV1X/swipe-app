"""
Добавляет новые товары в БД не трогая существующие.
Запуск: python parser/seed_new.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import SessionLocal
from db.models import Product, Base
from db.session import engine

Base.metadata.create_all(bind=engine)

NEW_PRODUCTS = [
    {
        "id": "prod_011",
        "title": "Платье миди в рубчик",
        "brand": "Zara",
        "price": 349900,
        "price_old": 499900,
        "image_url": "https://placehold.co/400x500/c9b8a8/0e0e0e?text=Zara+Dress",
        "marketplace": "lamoda",
        "external_url": "https://lamoda.ru",
        "category": "clothes",
        "gender": "female",
    },
    {
        "id": "prod_012",
        "title": "Худи оверсайз флис",
        "brand": "H&M",
        "price": 249900,
        "price_old": 349900,
        "image_url": "https://placehold.co/400x500/7a8c7e/ffffff?text=HM+Hoodie",
        "marketplace": "wb",
        "external_url": "https://wildberries.ru",
        "category": "clothes",
        "gender": "unisex",
    },
    {
        "id": "prod_013",
        "title": "Лоферы кожаные классика",
        "brand": "Massimo Dutti",
        "price": 1599900,
        "price_old": None,
        "image_url": "https://placehold.co/400x500/3d2b1f/ffffff?text=Loafers",
        "marketplace": "lamoda",
        "external_url": "https://lamoda.ru",
        "category": "shoes",
        "gender": "female",
    },
]

def seed_new():
    db = SessionLocal()
    added = 0
    skipped = 0
    for data in NEW_PRODUCTS:
        if db.get(Product, data["id"]):
            skipped += 1
            continue
        db.add(Product(**data))
        added += 1
    db.commit()
    db.close()
    print(f"✅ Добавлено: {added}, пропущено: {skipped}")

if __name__ == "__main__":
    seed_new()
