"""
Конфигурация приложения. Все настройки читаются из переменных окружения,
а если их нет — используются безопасные значения по умолчанию, чтобы
проект запускался "из коробки" без какой-либо настройки.
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _split_ids(raw: str) -> set[int]:
    out = set()
    for part in raw.split(","):
        part = part.strip()
        if part.isdigit():
            out.add(int(part))
    return out


class Config:
    # База данных. По умолчанию — локальный файл SQLite, чтобы можно было
    # запустить backend вообще без установки PostgreSQL.
    # Для продакшена (Railway/Render/любой Postgres) задайте DATABASE_URL вида
    # postgresql://user:password@host:5432/dbname
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./swipe.db")

    # Токен Telegram-бота — нужен только для проверки подписи initData,
    # если приложение открыто как Telegram Mini App. Для обычного веб-режима
    # (например, на Vercel) можно оставить пустым — тогда используется
    # анонимная авторизация по заголовку X-Anon-Id.
    BOT_TOKEN = os.getenv("BOT_TOKEN", "")

    # Список telegram_id админов через запятую. Если пусто — админка
    # доступна всем (удобно для разработки/демо).
    ADMIN_IDS = _split_ids(os.getenv("ADMIN_IDS", ""))

    # CORS
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
