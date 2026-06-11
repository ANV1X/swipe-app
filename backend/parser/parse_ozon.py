"""
Парсер Ozon через API поиска.
Запускать ТОЛЬКО на своём компьютере.
Запуск: python parser/parse_ozon.py
"""
import sys, os, time, random, json, re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from bs4 import BeautifulSoup
from db.session import SessionLocal
from db.models import Product, Base
from db.session import engine

Base.metadata.create_all(bind=engine)

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
})

SEARCHES = [
    ("платье",              "clothes",      "female"),
    ("блузка женская",      "clothes",      "female"),
    ("джинсы женские",      "clothes",      "female"),
    ("пальто женское",      "clothes",      "female"),
    ("куртка женская",      "clothes",      "female"),
    ("футболка мужская",    "clothes",      "male"),
    ("джинсы мужские",      "clothes",      "male"),
    ("толстовка мужская",   "clothes",      "male"),
    ("куртка мужская",      "clothes",      "male"),
    ("кроссовки женские",   "shoes",        "female"),
    ("ботинки женские",     "shoes",        "female"),
    ("кроссовки мужские",   "shoes",        "male"),
    ("ботинки мужские",     "shoes",        "male"),
    ("сумка женская",       "accessories",  "female"),
    ("рюкзак",              "accessories",  "unisex"),
]

def clean_price(s: str) -> int | None:
    """'1 990 ₽' → 199000 (копейки)"""
    try:
        digits = re.sub(r"[^\d]", "", str(s))
        return int(digits) * 100 if digits else None
    except Exception:
        return None


def fetch_ozon_search(query: str, page: int = 1) -> list:
    """
    Ozon отдаёт данные товаров в window.__NUXT__ / JSON в теге <script>.
    Парсим через BeautifulSoup + regex.
    """
    url = "https://www.ozon.ru/search/"
    params = {"text": query, "page": page}
    products = []
    try:
        r = SESSION.get(url, params=params, timeout=15)
        if r.status_code != 200:
            return []

        soup = BeautifulSoup(r.text, "html.parser")

        # Ozon прячет данные в <script type="application/json">
        for tag in soup.find_all("script"):
            text = tag.string or ""
            if '"skuId"' in text or '"finalPrice"' in text:
                # Пробуем найти JSON-объекты товаров
                matches = re.findall(r'\{[^{}]*"skuId"\s*:\s*(\d+)[^{}]*\}', text)
                # Более полный парсинг через поиск блоков
                try:
                    # Ищем initialState или подобное
                    json_match = re.search(r'window\.__INITIAL_STATE__\s*=\s*({.+?});\s*</script>', text, re.DOTALL)
                    if json_match:
                        data = json.loads(json_match.group(1))
                        # Обходим вложенную структуру
                        items = _extract_ozon_products(data)
                        products.extend(items)
                except Exception:
                    pass

        # Если ничего — ищем карточки напрямую в HTML
        if not products:
            products = _parse_ozon_html(soup)

    except Exception as e:
        print(f"    Ozon ошибка: {e}")
    return products


def _extract_ozon_products(data: dict) -> list:
    """Рекурсивно ищем товары в JSON-структуре Ozon."""
    results = []
    if isinstance(data, dict):
        if "skuId" in data and ("finalPrice" in data or "price" in data):
            results.append(data)
        for v in data.values():
            results.extend(_extract_ozon_products(v))
    elif isinstance(data, list):
        for item in data:
            results.extend(_extract_ozon_products(item))
    return results


def _parse_ozon_html(soup: BeautifulSoup) -> list:
    """Парсим карточки товаров из HTML Ozon."""
    products = []
    # Ozon использует data-атрибуты и классы которые меняются
    # Ищем через универсальные паттерны
    cards = soup.find_all("div", attrs={"data-index": True}) or \
            soup.find_all("article") or \
            soup.find_all("div", class_=re.compile(r"tile|product|item", re.I))

    for card in cards[:50]:
        try:
            # Ищем ссылку на товар
            link_tag = card.find("a", href=re.compile(r"/product/"))
            if not link_tag:
                continue
            href = link_tag.get("href", "")
            # Достаём ID из URL вида /product/nazvanie-123456/
            id_match = re.search(r"/product/[^/]+-(\d+)/", href)
            if not id_match:
                id_match = re.search(r"-(\d{6,})/?", href)
            if not id_match:
                continue
            prod_id = id_match.group(1)

            # Название
            name_tag = card.find(["h3", "h4", "span"], string=re.compile(r"\w{5,}"))
            name = name_tag.get_text(strip=True) if name_tag else ""
            if not name:
                continue

            # Цены — ищем элементы с ₽
            price_tags = card.find_all(string=re.compile(r"\d[\d\s]+₽"))
            prices = []
            for pt in price_tags:
                p = clean_price(pt)
                if p and p > 50_00:
                    prices.append(p)

            if not prices:
                continue

            prices.sort()
            price = prices[0]
            price_old = prices[-1] if len(prices) > 1 and prices[-1] > price else None

            # Фото
            img_tag = card.find("img")
            image_url = ""
            if img_tag:
                image_url = img_tag.get("src") or img_tag.get("data-src") or ""

            if not image_url or "data:image" in image_url:
                continue

            products.append({
                "id":    prod_id,
                "name":  name,
                "price": price,
                "price_old": price_old,
                "image_url": image_url,
                "url":  f"https://www.ozon.ru{href}" if href.startswith("/") else href,
            })
        except Exception:
            continue
    return products


def parse_to_model(raw: dict, cat: str, gender: str) -> dict | None:
    try:
        pid = str(raw.get("id") or raw.get("skuId") or "")
        if not pid:
            return None
        name = str(raw.get("name") or raw.get("title") or raw.get("displayName") or "").strip()
        if not name:
            return None
        brand = str(raw.get("brand") or raw.get("brandName") or "Ozon").strip()

        price = raw.get("price") or raw.get("finalPrice") or raw.get("priceFormatted")
        price_old = raw.get("price_old") or raw.get("originalPrice")

        if isinstance(price, str):
            price = clean_price(price)
        else:
            price = int(price) * 100 if price else None

        if isinstance(price_old, str):
            price_old = clean_price(price_old)
        elif price_old:
            price_old = int(price_old) * 100

        if not price or price < 50_00:
            return None

        image_url = raw.get("image_url") or raw.get("coverImage") or raw.get("imageSrc") or ""
        if not image_url:
            return None

        url = raw.get("url") or f"https://www.ozon.ru/product/{pid}/"

        return {
            "id":           f"ozon_{pid}",
            "title":        name[:200],
            "brand":        brand[:100],
            "price":        price,
            "price_old":    price_old if price_old and price_old > price else None,
            "image_url":    image_url,
            "marketplace":  "ozon",
            "external_url": url,
            "category":     cat,
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
    print("🔵 Ozon\n")
    total = 0
    seen  = set()

    for query, cat, gender in SEARCHES:
        batch = []
        for page in range(1, 3):
            raws = fetch_ozon_search(query, page)
            for r in raws:
                pid = str(r.get("id") or r.get("skuId") or "")
                key = f"ozon_{pid}"
                if pid and key not in seen:
                    seen.add(key)
                    p = parse_to_model(r, cat, gender)
                    if p:
                        batch.append(p)
            time.sleep(random.uniform(1.0, 2.0))

        added, skipped = save(batch)
        total += added
        print(f"  '{query}' → +{added} (собрано {len(batch)})")
        time.sleep(random.uniform(1.5, 2.5))

    print(f"\n  ✅ Ozon итого: {total} товаров\n")
    return total


if __name__ == "__main__":
    run()
