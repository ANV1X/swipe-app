from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.database import SessionLocal
from app.models import Product, PriceDrop, Notification
from app.utils.price_parser import fetch_price_from_marketplace
import asyncio
import random

def check_prices():
    db = SessionLocal()
    products = db.query(Product).all()
    for product in products:
        new_price = asyncio.run(fetch_price_from_marketplace(product))
        if new_price < product.price:
            drop = PriceDrop(
                product_id=product.id,
                old_price=product.price,
                new_price=new_price
            )
            db.add(drop)
            product.old_price = product.price
            product.price = new_price
            # Уведомления
            wishlist_users = db.query(Product.wishlist_items).filter(Product.id == product.id).all()
            for user in wishlist_users:
                notif = Notification(
                    user_id=user.id,
                    type="price_drop",
                    title="Цена снизилась!",
                    message=f"Товар {product.name} подешевел до {new_price} ₽",
                    data={"product_id": product.id, "old_price": drop.old_price, "new_price": drop.new_price}
                )
                db.add(notif)
    db.commit()
    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_prices, IntervalTrigger(hours=6))