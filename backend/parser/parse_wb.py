"""
Парсер Wildberries через публичный поисковый API.
Запускать ТОЛЬКО на своём компьютере, не на сервере.
Запуск: python parser/parse_wb.py
"""
import sys, os, time, random
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from db.session import SessionLocal
from db.models import Product, Base
from db.session import engine

Base.metadata.create_all(bind=engine)

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Origin": "https://www.wildberries.ru",
    "Referer": "https://www.wildberries.ru/",
    "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
})

# Поисковые запросы по категориям
SEARCHES = [
    # (запрос, категория, пол)
    ("платье женское",          "clothes",     "female"),
    ("блузка женская",          "clothes",     "female"),
    ("джинсы женские",          "clothes",     "female"),
    ("пальто женское",          "clothes",     "female"),
    ("куртка женская",          "clothes",     "female"),
    ("свитер женский",          "clothes",     "female"),
    ("футболка женская",        "clothes",     "female"),
    ("футболка мужская",        "clothes",     "male"),
    ("джинсы мужские",          "clothes",     "male"),
    ("худи мужское",            "clothes",     "male"),
    ("куртка мужская",          "clothes",     "male"),
    ("рубашка мужская",         "clothes",     "male"),
    ("кроссовки женские",       "shoes",       "female"),
    ("ботинки женские",         "shoes",       "female"),
    ("туфли женские",           "shoes",       "female"),
    ("кроссовки мужские",       "shoes",       "male"),
    ("ботинки мужские",         "shoes",       "male"),
    ("сумка женская",           "accessories", "female"),
    ("рюкзак",                  "accessories", "unisex"),
    ("ремень кожаный",          "accessories", "unisex"),
]

def search_wb(query: str, page: int = 1) -> list:
    url = "https://search.wb.ru/exactmatch/ru/common/v5/search"
    params = {
        "ab_testing": "false",
        "appType": "1",
        "curr": "rub",
        "dest": "-1257786",
        "query": query,
        "resultset": "catalog",
        "sort": "popular",
        "spp": "30",
        "suppressSpellcheck": "false",
        "page": str(page),
    }
    try:
        r = SESSION.get(url, params=params, timeout=12)
        if r.status_code == 200:
            data = r.json()
            return data.get("data", {}).get("products", [])
        else:
            print(f"    WB статус {r.status_code} для '{query}'")
    except Exception as e:
        print(f"    WB ошибка: {e}")
    return []


def make_image_url(nm_id: int) -> str:
    vol = nm_id // 100000
    part = nm_id // 1000
    basket = vol % 18 + 1
    return f"https://basket-{basket:02d}.wbbasket.ru/vol{vol}/part{part}/{nm_id}/images/big/1.webp"


def parse_item(raw: dict, category: str, gender: str) -> dict | None:
    try:
        nm_id = int(raw.get("id", 0))
        if not nm_id:
            return None

        name  = raw.get("name", "").strip()
        brand = raw.get("brand", "").strip() or "WB"
        if not name:
            return None

        # Цены — WB отдаёт в единицах 1/100 рубля (× 100 = копейки × 100)
        # salePriceU и priceU уже в копейках × 100, делим на 100 → получаем копейки
        sale  = raw.get("salePriceU", 0)
        orig  = raw.get("priceU", 0)

        # Бывает что priceU = 0, берём sale
        if not sale:
            return None

        price     = sale // 100        # копейки
        price_old = orig // 100 if orig and orig != sale else None

        if price < 50_00:              # меньше 50 ₽ — мусор
            return None

        image_url   = make_image_url(nm_id)
        product_url = f"https://www.wildberries.ru/catalog/{nm_id}/detail.aspx"

        return {
            "id":           f"wb_{nm_id}",
            "title":        name[:200],
            "brand":        brand[:100],
            "price":        price,
            "price_old":    price_old,
            "image_url":    image_url,
            "marketplace":  "wb",
            "external_url": product_url,
            "category":     category,
            "gender":       gender,
        }
    except Exception:
        return None


def save(products: list) -> tuple[int, int]:
    db = SessionLocal()
    added = skipped = 0
    for p in products:
        if db.get(Product, p["id"]):
            skipped += 1
        else:
            try:
                db.add(Product(**p))
                added += 1
            except Exception:
                db.rollback()
    db.commit()
    db.close()
    return added, skipped


def run():
    print("🟣 Wildberries\n")
    total = 0
    seen  = set()

    for query, cat, gender in SEARCHES:
        batch = []
        for page in range(1, 4):          # 3 страницы × ~100 = 300 на запрос
            raws = search_wb(query, page)
            if not raws:
                break
            for r in raws:
                pid = f"wb_{r.get('id')}"
                if pid not in seen:
                    seen.add(pid)
                    p = parse_item(r, cat, gender)
                    if p:
                        batch.append(p)
            time.sleep(random.uniform(0.4, 0.8))

        added, skipped = save(batch)
        total += added
        print(f"  '{query}' → +{added} (пропущено {skipped})")
        time.sleep(random.uniform(1.0, 1.8))

    print(f"\n  ✅ WB итого: {total} товаров\n")
    return total


if __name__ == "__main__":
    run()
