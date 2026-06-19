from app.database import SessionLocal
from app.models import Product

def seed():
    db = SessionLocal()
    if db.query(Product).count() == 0:
        products = [
            Product(
                name="Кроссовки Nike Air Max",
                description="Легкие, удобные, стильные",
                price=8990.0,
                currency="RUB",
                image_url="https://example.com/nike.jpg",
                category="Обувь",
                style="sport",
                brand="Nike",
                marketplace_url="https://www.wildberries.ru/catalog/...",
                marketplace="wb",
                is_sponsored=False
            ),
            # добавьте ещё товары для теста
        ]
        db.add_all(products)
        db.commit()
    db.close()