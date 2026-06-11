from aiogram import Bot, Dispatcher
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME", "@your_channel")  # @username канала
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://your-app.vercel.app")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


async def notify_price_drop(user_id: str, product, new_price: int):
    """Уведомление о падении цены."""
    if not BOT_TOKEN:
        return
    drop = product.price - new_price
    drop_pct = round(drop / product.price * 100)
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text=f"Купить за {new_price//100:,} ₽ →".replace(',', ' '),
                             url=product.external_url)
    ]])
    try:
        await bot.send_message(
            int(user_id),
            f"🔥 Цена упала на {drop_pct}%!\n\n"
            f"<b>{product.title}</b>\n"
            f"<s>{product.price//100:,} ₽</s>  →  <b>{new_price//100:,} ₽</b>\n"
            f"Сэкономишь {drop//100:,} ₽".replace(',', ' '),
            parse_mode="HTML",
            reply_markup=kb,
        )
    except Exception as e:
        print(f"[bot] notify error for {user_id}: {e}")


async def send_daily_drop(products: list):
    """Ежедневный дроп новинок в канал."""
    if not BOT_TOKEN or not products:
        return
    lines = ["🛍️ <b>Дроп дня — свежие находки</b>\n"]
    for p in products[:5]:
        price_str = f"{p.price//100:,} ₽".replace(',', ' ')
        old_str = f" <s>{p.price_old//100:,} ₽</s>".replace(',', ' ') if p.price_old else ""
        lines.append(f"• <b>{p.title}</b>{old_str} — {price_str}")
    lines.append(f"\n👆 Открыть и свайпать → {MINI_APP_URL}")
    text = "\n".join(lines)
    try:
        await bot.send_message(CHANNEL_USERNAME, text, parse_mode="HTML")
        print("[bot] daily drop sent")
    except Exception as e:
        print(f"[bot] daily drop error: {e}")
