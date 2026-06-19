from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from app.config import Config

bot = Bot(token=Config.BOT_TOKEN)
dp = Dispatcher(bot)

async def send_notification(telegram_id: int, text: str, reply_markup: InlineKeyboardMarkup = None):
    await bot.send_message(chat_id=telegram_id, text=text, reply_markup=reply_markup)

@dp.message_handler(commands=['start'])
async def start(message: types.Message):
    await message.reply("Добро пожаловать в Swipe Fashion! Используйте мини-приложение.")