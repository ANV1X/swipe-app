"""
Наполняет пустую базу демонстрационными данными: товары, коллекции, батл.
Запускается автоматически при старте приложения, если таблица products пуста.
Изображения — случайные, но стабильные плейсхолдеры с picsum.photos (без
использования брендовых фото, чтобы не нарушать авторские права).
"""
import random

from sqlalchemy.orm import Session

from app.models import Product, Collection, CollectionItem, Battle, PriceHistory

random.seed(42)

BRANDS = ["Zara", "H&M", "Uniqlo", "COS", "Mango", "New Balance", "Nike", "Adidas", "Reserved", "Pull&Bear"]

# Те же id, что и в анкете онбординга (см. OnboardingPage.tsx) — чтобы фильтры
# и персонализация реально совпадали со вкусом, который выбирает пользователь.
STYLES = ["minimal", "casual", "street", "smart", "sport", "romantic", "dark", "boho"]
COLORS = ["black", "white", "beige", "khaki", "navy", "gray", "brown", "green", "pink", "red"]

CLOTHES = {
    "female": ["Платье миди", "Юбка плиссе", "Блузка шёлковая", "Кардиган оверсайз",
               "Топ в рубчик", "Пальто шерстяное", "Жакет приталенный", "Брюки палаццо"],
    "male": ["Рубашка оксфорд", "Худи базовое", "Брюки чинос", "Куртка бомбер",
             "Свитер крупной вязки", "Поло хлопковое", "Джинсы прямые", "Жилет утеплённый"],
    "unisex": ["Толстовка с капюшоном", "Футболка оверсайз", "Ветровка", "Спортивные штаны"],
}
SHOES = {
    "female": ["Кроссовки белые", "Ботильоны на каблуке", "Балетки замшевые", "Сапоги челси"],
    "male": ["Кеды низкие", "Ботинки дерби", "Кроссовки беговые", "Лоферы кожаные"],
    "unisex": ["Сникеры классические", "Слипоны", "Кроссовки ретро"],
}
ACCESSORIES = {
    "female": ["Сумка через плечо", "Серьги-кольца", "Шарф шёлковый", "Очки солнцезащитные"],
    "male": ["Ремень кожаный", "Кепка бейсболка", "Бумажник", "Часы наручные"],
    "unisex": ["Рюкзак городской", "Шапка вязаная", "Перчатки кожаные"],
}

MARKETPLACES = ["Wildberries", "Ozon", "Lamoda"]


def _price_set(base_min: int, base_max: int) -> tuple[int, int | None]:
    price = random.randrange(base_min, base_max, 100)
    if random.random() < 0.4:
        old = int(price * random.uniform(1.15, 1.6) / 100) * 100
        return price, old
    return price, None


def _make_products(n_per_group: int = 6) -> list[Product]:
    products: list[Product] = []
    groups = [
        (CLOTHES, "Одежда", 1500, 9000),
        (SHOES, "Обувь", 2500, 14000),
        (ACCESSORIES, "Аксессуары", 800, 6000),
    ]
    img_counter = 0
    for items_by_gender, category, pmin, pmax in groups:
        for gender, names in items_by_gender.items():
            for _ in range(n_per_group):
                name = random.choice(names)
                brand = random.choice(BRANDS)
                price, price_old = _price_set(pmin, pmax)
                discount_pct = round((1 - price / price_old) * 100) if price_old else None
                img_counter += 1
                marketplace = random.choice(MARKETPLACES)
                products.append(Product(
                    title=name,
                    brand=brand,
                    price=price,
                    price_old=price_old,
                    image_url=f"https://picsum.photos/seed/swipe{img_counter}/600/800",
                    marketplace=marketplace,
                    external_url=f"https://example.com/product/{img_counter}",
                    category=category,
                    gender=gender,
                    style=random.choice(STYLES),
                    color=random.choice(COLORS),
                    discount_pct=discount_pct,
                ))
    random.shuffle(products)
    return products


def _make_price_history(db: Session, products: list[Product]) -> None:
    """Генерирует правдоподобную историю цены за последние 90 дней для каждого товара."""
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    for p in products:
        price = p.price_old or p.price
        n_points = random.randint(4, 7)
        step_days = 90 // n_points
        for i in range(n_points):
            day_offset = 90 - i * step_days
            # цена постепенно сходится к текущей с лёгким случайным шумом
            progress = i / max(n_points - 1, 1)
            target = price + (p.price - price) * progress
            noisy = int(target * random.uniform(0.97, 1.03) / 50) * 50
            db.add(PriceHistory(
                product_id=p.id, price=max(noisy, 100),
                created_at=now - timedelta(days=day_offset),
            ))
        db.add(PriceHistory(product_id=p.id, price=p.price, created_at=now))


def seed_database(db: Session) -> None:
    existing = db.query(Product).first()
    if existing:
        return  # уже наполнено

    products = _make_products()
    db.add_all(products)
    db.flush()  # чтобы получить id

    _make_price_history(db, products)

    collections_meta = [
        ("Минимализм на каждый день", "Аня Стиль", "@anya.style"),
        ("Спортивный шик", "Максим Run", "@max.run"),
        ("Офисный гардероб", "Lookbook Pro", "@lookbookpro"),
        ("Уличная мода", "Street Vibes", "@streetvibes"),
        ("Капсула на лето", "Капсула.рф", "@kapsula"),
    ]
    seeded_collections: list[Collection] = []
    for name, author_name, handle in collections_meta:
        c = Collection(
            name=name, author_name=author_name, author_handle=handle,
            cover_image=random.choice(products).image_url,
            subscribers_count=random.randint(120, 4200),
            is_official=True,  # это встроенные подборки Swipe, не пользовательские
        )
        db.add(c)
        db.flush()
        picks = random.sample(products, k=min(8, len(products)))
        for p in picks:
            db.add(CollectionItem(collection_id=c.id, product_id=p.id))
        seeded_collections.append(c)

    # Один активный батл для старта — официальная коллекция vs официальная
    a, b = random.sample(seeded_collections, 2)
    db.add(Battle(
        collection_a_id=a.id, collection_b_id=b.id,
        votes_a=random.randint(5, 40), votes_b=random.randint(5, 40),
        prize_emoji="🎟️", prize_title="Промокод на скидку 1000₽ у партнёра", prize_type="promocode",
        active=True,
    ))

    # Пара завершённых батлов — чтобы сетка сражений не была пустой
    from datetime import datetime, timedelta
    finished_presets = [
        ("⭐", "50 Telegram Stars", "stars"),
        ("💎", "1 месяц Telegram Premium", "premium"),
    ]
    for i, (emoji, title, ptype) in enumerate(finished_presets):
        c1, c2 = random.sample(seeded_collections, 2)
        db.add(Battle(
            collection_a_id=c1.id, collection_b_id=c2.id,
            votes_a=random.randint(20, 200), votes_b=random.randint(20, 200),
            prize_emoji=emoji, prize_title=title, prize_type=ptype,
            active=False, created_at=datetime.utcnow() - timedelta(days=7 * (i + 1)),
        ))

    db.commit()
