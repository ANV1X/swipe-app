"""
Скрипт для наполнения БД тестовыми товарами.
Запуск: python parser/seed.py

Замени товары на реальные из Lamoda Affiliate API или добавь свои.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import SessionLocal
from db.models import Product, Base
from db.session import engine

Base.metadata.create_all(bind=engine)

PRODUCTS = [
    {
        "id": "prod_001",
        "title": "Футболка базовая оверсайз",
        "brand": "Zara",
        "price": 189900,       # 1 899 ₽ в копейках
        "price_old": 259900,
        "image_url": "https://placehold.co/400x500/f5f2ec/0e0e0e?text=Zara+Tee",
        "marketplace": "lamoda",
        "external_url": "https://lamoda.ru",
        "category": "clothes",
        "gender": "female",
    },
    {
        "id": "prod_002",
        "title": "Джинсы прямые 501",
        "brand": "Levi's",
        "price": 899900,
        "price_old": 1099900,
        "image_url": "https://placehold.co/400x500/e8e4db/0e0e0e?text=Levis+501",
        "marketplace": "wb",
        "external_url": "https://wildberries.ru",
        "category": "clothes",
        "gender": "unisex",
    },
    {
        "id": "prod_003",
        "title": "Кроссовки Air Force 1",
        "brand": "Nike",
        "price": 1299900,
        "price_old": None,
        "image_url": "https://placehold.co/400x500/ffffff/0e0e0e?text=Nike+AF1",
        "marketplace": "ozon",
        "external_url": "https://ozon.ru",
        "category": "shoes",
        "gender": "unisex",
    },
    {
        "id": "prod_004",
        "title": "Тренч классический бежевый",
        "brand": "Massimo Dutti",
        "price": 2499900,
        "price_old": 3299900,
        "image_url": "https://placehold.co/400x500/d4c5a9/0e0e0e?text=Trench",
        "marketplace": "lamoda",
        "external_url": "https://lamoda.ru",
        "category": "clothes",
        "gender": "female",
    },
    {
        "id": "prod_005",
        "title": "Сумка Tabby Medium",
        "brand": "Coach",
        "price": 3999900,
        "price_old": None,
        "image_url": "https://placehold.co/400x500/2a1a0e/ffffff?text=Coach+Bag",
        "marketplace": "lamoda",
        "external_url": "https://lamoda.ru",
        "category": "accessories",
        "gender": "female",
    },
    {
        "id": "prod_006",
        "title": "Рубашка льняная оверсайз",
        "brand": "Massimo Dutti",
        "price": 799900,
        "price_old": 999900,
        "image_url": "https://placehold.co/400x500/e8e0d5/0e0e0e?text=Linen+Shirt",
        "marketplace": "lamoda",
        "external_url": "https://lamoda.ru",
        "category": "clothes",
        "gender": "male",
    },
    {
        "id": "prod_007",
        "title": "Кроссовки 530",
        "brand": "New Balance",
        "price": 1199900,
        "price_old": 1399900,
        "image_url": "https://placehold.co/400x500/c8c8c8/0e0e0e?text=NB+530",
        "marketplace": "ozon",
        "external_url": "https://ozon.ru",
        "category": "shoes",
        "gender": "unisex",
    },
    {
        "id": "prod_008",
        "title": "Пуховик оверсайз",
        "brand": "Zara",
        "price": 599900,
        "price_old": 899900,
        "image_url": "https://placehold.co/400x500/1a1a2e/ffffff?text=Down+Jacket",
        "marketplace": "wb",
        "external_url": "https://wildberries.ru",
        "category": "clothes",
        "gender": "female",
    },
    {
        "id": "prod_009",
        "title": "Брюки прямые классика",
        "brand": "befree",
        "price": 299900,
        "price_old": 399900,
        "image_url": "https://placehold.co/400x500/2c2c2c/ffffff?text=Trousers",
        "marketplace": "wb",
        "external_url": "https://wildberries.ru",
        "category": "clothes",
        "gender": "female",
    },
    {
        "id": "prod_010",
        "title": "Кепка с вышивкой",
        "brand": "Zara",
        "price": 149900,
        "price_old": None,
        "image_url": "https://placehold.co/400x500/0e0e0e/ffffff?text=Cap",
        "marketplace": "lamoda",
        "external_url": "https://lamoda.ru",
        "category": "accessories",
        "gender": "unisex",
    },
]


def seed():
    db = SessionLocal()
    added = 0
    skipped = 0

    for data in PRODUCTS:
        existing = db.get(Product, data["id"])
        if existing:
            skipped += 1
            continue
        product = Product(**data)
        db.add(product)
        added += 1

    db.commit()
    db.close()
    print(f"✅ Добавлено: {added} товаров, пропущено (уже есть): {skipped}")


if __name__ == "__main__":
    seed()
