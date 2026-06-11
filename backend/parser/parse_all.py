"""
Запускает все три парсера последовательно.
Запуск: python parser/parse_all.py

После парсинга автоматически обновляет историю цен.
"""
import sys, os, time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_all():
    print("=" * 50)
    print("  SWIPE FASHION — Наполнение каталога")
    print("=" * 50)
    print()
    
    total = 0
    
    # WB
    try:
        from parser.parse_wb import run as run_wb
        total += run_wb()
    except Exception as e:
        print(f"❌ WB ошибка: {e}")
    
    print()
    time.sleep(3)
    
    # Ozon
    try:
        from parser.parse_ozon import run as run_ozon
        total += run_ozon()
    except Exception as e:
        print(f"❌ Ozon ошибка: {e}")
    
    print()
    time.sleep(3)
    
    # Lamoda
    try:
        from parser.parse_lamoda import run as run_lamoda
        total += run_lamoda()
    except Exception as e:
        print(f"❌ Lamoda ошибка: {e}")
    
    print()
    
    # История цен для новых товаров
    print("📈 Генерируем историю цен...")
    try:
        from parser.seed_prices import seed_new as seed_prices
        seed_prices()
    except Exception as e:
        print(f"  ⚠️  История цен: {e}")
    
    print()
    print("=" * 50)
    print(f"  ✅ Итого добавлено: {total} товаров")
    print("=" * 50)

# Функция для seed_prices которая добавляет только новые
def seed_new():
    import random
    from datetime import datetime, timedelta
    from db.session import SessionLocal
    from db.models import PriceHistory, Product
    
    db = SessionLocal()
    # Берём только товары без истории
    products_with_history = db.query(PriceHistory.product_id).distinct().all()
    existing_ids = {p[0] for p in products_with_history}
    
    new_products = db.query(Product).filter(Product.id.notin_(existing_ids)).all()
    added = 0
    
    for product in new_products:
        for i in range(8, 0, -1):
            days_ago = i * 10
            date = datetime.utcnow() - timedelta(days=days_ago)
            variation = random.uniform(0.85, 1.25)
            price = max(int(product.price * variation), 1000)
            price = round(price / 100) * 100
            db.add(PriceHistory(product_id=product.id, price=price, created_at=date))
            added += 1
    
    db.commit()
    db.close()
    print(f"  ✅ Добавлено {added} точек истории цен")

if __name__ == "__main__":
    run_all()
