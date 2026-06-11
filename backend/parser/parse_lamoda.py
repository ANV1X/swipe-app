"""
Парсер Lamoda через публичное API.
Самый стабильный из трёх — Lamoda хорошо структурирован.
Запуск: python parser/parse_lamoda.py
"""
import sys, os, time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from db.session import SessionLocal
from db.models import Product, Base
from db.session import engine

Base.metadata.create_all(bind=engine)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json",
    "Accept-Language": "ru-RU,ru;q=0.9",
    "Referer": "https://www.lamoda.ru/",
    "x-requested-with": "XMLHttpRequest",
}

# Категории Lamoda с их slug
CATEGORIES = [
    {"slug": "zhenskaya-odezhda",  "cat": "clothes",     "gender": "female", "name": "Женская одежда"},
    {"slug": "muzhskaya-odezhda",  "cat": "clothes",     "gender": "male",   "name": "Мужская одежда"},
    {"slug": "zhenskaya-obuv",     "cat": "shoes",       "gender": "female", "name": "Женская обувь"},
    {"slug": "muzhskaya-obuv",     "cat": "shoes",       "gender": "male",   "name": "Мужская обувь"},
    {"slug": "sumki",              "cat": "accessories", "gender": "female", "name": "Сумки"},
    {"slug": "aksessuary",         "cat": "accessories", "gender": "unisex", "name": "Аксессуары"},
]

def fetch_lamoda_catalog(slug: str, page: int = 1, per_page: int = 60) -> list:
    """Получаем товары из каталога Lamoda."""
    url = f"https://api.lamoda.ru/v1/catalog/{slug}"
    params = {
        "page": page,
        "per_page": per_page,
        "sort": "popularity",
        "gender": "female",
    }
    try:
        r = httpx.get(url, params=params, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            data = r.json()
            return data.get("payload", {}).get("products", [])
    except Exception as e:
        pass
    
    # Fallback — через основной сайт
    return fetch_lamoda_site(slug, page)


def fetch_lamoda_site(slug: str, page: int = 1) -> list:
    """Фолбэк через сайт Lamoda."""
    url = f"https://www.lamoda.ru/{slug}/"
    params = {
        "page": page,
        "json": 1,
    }
    try:
        r = httpx.get(url, params=params, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            data = r.json()
            # Разные структуры ответа
            products = (
                data.get("products") or
                data.get("payload", {}).get("products") or
                data.get("data", {}).get("products") or
                []
            )
            return products
    except Exception as e:
        pass
    return []


def parse_lamoda_item(item: dict, category: str, gender: str) -> dict | None:
    """Парсим один товар Lamoda."""
    try:
        # SKU
        sku = item.get("sku") or item.get("id") or item.get("vendor_code")
        if not sku:
            return None
        
        # Название
        brand = item.get("brand", {})
        brand_name = brand.get("title") if isinstance(brand, dict) else str(brand)
        
        model = item.get("name") or item.get("model_name") or item.get("title", "")
        if not model:
            return None
        
        title = f"{brand_name} {model}".strip() if brand_name else model
        
        # Цены
        prices = item.get("prices", {})
        if isinstance(prices, dict):
            price_str = prices.get("actual", {}).get("amount", "") or prices.get("price", "")
            old_price_str = prices.get("original", {}).get("amount", "") or prices.get("original_price", "")
        else:
            price_str = item.get("price", "")
            old_price_str = item.get("price_old", "")
        
        def parse_price(s) -> int | None:
            try:
                return int(float(str(s).replace(" ", "").replace(",", ".").replace("₽", "").replace("\u00a0", ""))) * 100
            except:
                return None
        
        price = parse_price(price_str)
        price_old = parse_price(old_price_str)
        
        if not price or price < 10000:
            return None
        
        # Фото
        images = item.get("images", [])
        if images:
            img = images[0]
            if isinstance(img, dict):
                image_url = img.get("url") or img.get("src") or ""
            else:
                image_url = str(img)
        else:
            image_url = item.get("image", "") or item.get("thumbnail", "")
        
        if not image_url:
            return None
        
        # Добавляем https если нужно
        if image_url.startswith("//"):
            image_url = "https:" + image_url
        
        # URL товара
        link = item.get("link") or item.get("url") or f"/catalogue/{sku}/"
        if not link.startswith("http"):
            link = "https://www.lamoda.ru" + link
        
        return {
            "id": f"lamoda_{sku}",
            "title": title[:200],
            "brand": brand_name[:100] if brand_name else "Lamoda",
            "price": price,
            "price_old": price_old if price_old and price_old > price else None,
            "image_url": image_url,
            "marketplace": "lamoda",
            "external_url": link,
            "category": category,
            "gender": gender,
        }
    except Exception:
        return None


def save_products(products: list) -> tuple:
    db = SessionLocal()
    added = skipped = 0
    for p in products:
        try:
            if db.get(Product, p["id"]):
                skipped += 1
                continue
            db.add(Product(**p))
            added += 1
        except:
            pass
    db.commit()
    db.close()
    return added, skipped


def run():
    print("🔍 Парсим Lamoda...\n")
    total_added = 0
    
    for cat in CATEGORIES:
        print(f"  📁 {cat['name']}...")
        all_products = []
        seen = set()
        
        for page in range(1, 4):
            items = fetch_lamoda_catalog(cat["slug"], page)
            if not items:
                break
            for item in items:
                parsed = parse_lamoda_item(item, cat["cat"], cat["gender"])
                if parsed and parsed["id"] not in seen:
                    seen.add(parsed["id"])
                    all_products.append(parsed)
            time.sleep(1)
        
        added, skipped = save_products(all_products)
        total_added += added
        print(f"     ✅ Добавлено: {added}, собрано: {len(all_products)}")
        time.sleep(2)
    
    print(f"\n🎉 Lamoda готов. Всего добавлено: {total_added} товаров")
    return total_added


if __name__ == "__main__":
    run()
