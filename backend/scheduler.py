"""
Планировщик задач:
- Каждые 6 часов: проверка цен на товары в вишлистах
- Каждый день в 10:00: дейли-дроп в Telegram-канал

Запуск отдельно: python scheduler.py
Или встроен в main.py через lifespan.
"""
import asyncio
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from db.session import SessionLocal
from db.models import Wishlist, Product, PriceHistory, User
from bot import notify_price_drop, send_daily_drop
import uuid

scheduler = AsyncIOScheduler(timezone="Europe/Moscow")


async def fetch_current_price(url: str) -> int | None:
    """
    Получает текущую цену товара по URL.
    Сейчас — заглушка. В продакшене подключи парсер или Lamoda API.
    Возвращает цену в копейках или None если не удалось.
    """
    # TODO: реализовать парсинг цены с маркетплейса
    # Пример для Lamoda через их affiliate API:
    # async with httpx.AsyncClient() as client:
    #     resp = await client.get(f"https://api.lamoda.ru/price?url={url}")
    #     return resp.json()["price"]
    return None


@scheduler.scheduled_job("interval", hours=6, id="check_prices")
async def check_prices():
    """Проверяет цены на товары в вишлистах и шлёт уведомления."""
    print("⏰ Checking prices...")
    db = SessionLocal()
    
    try:
        # Берём все уникальные товары из всех вишлистов
        wishlist_items = db.scalars(select(Wishlist)).all()
        
        # Группируем по product_id чтобы не проверять один товар 100 раз
        checked_products: set[str] = set()
        
        for item in wishlist_items:
            product = db.get(Product, item.product_id)
            if not product or item.product_id in checked_products:
                continue
            checked_products.add(item.product_id)
            
            new_price = await fetch_current_price(product.external_url)
            if not new_price:
                continue
            
            drop_pct = (product.price - new_price) / product.price
            
            if drop_pct >= 0.10:  # упало на 10%+
                # Уведомляем всех кто добавил этот товар
                owners = db.scalars(
                    select(Wishlist.user_id).where(Wishlist.product_id == item.product_id)
                ).all()
                
                for user_id in owners:
                    await notify_price_drop(user_id, product, new_price)
                
                # Сохраняем в историю
                db.add(PriceHistory(
                    id=str(uuid.uuid4()),
                    product_id=product.id,
                    price=new_price
                ))
                product.price = new_price
                db.commit()
                print(f"  Price drop: {product.title} → {new_price // 100} ₽")
    
    except Exception as e:
        print(f"check_prices error: {e}")
    finally:
        db.close()


@scheduler.scheduled_job("cron", hour=10, minute=0, id="daily_drop")
async def daily_drop():
    """Каждый день в 10:00 постит подборку в канал."""
    print("📬 Sending daily drop...")
    db = SessionLocal()
    
    try:
        # Берём 5 товаров со скидкой
        products = db.scalars(
            select(Product)
            .where(Product.price_old.isnot(None))
            .order_by((Product.price_old - Product.price).desc())
            .limit(5)
        ).all()
        
        if not products:
            # Если нет скидок — просто новые товары
            products = db.scalars(
                select(Product).order_by(Product.created_at.desc()).limit(5)
            ).all()
        
        await send_daily_drop(products)
    
    except Exception as e:
        print(f"daily_drop error: {e}")
    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("✅ Scheduler started (price checks every 6h, daily drop at 10:00 MSK)")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
