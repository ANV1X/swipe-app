import random

async def fetch_price_from_marketplace(product):
    # Заглушка: возвращаем цену со случайным изменением
    return product.price * (0.85 + 0.3 * random.random())