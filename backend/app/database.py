from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import Config

connect_args = {}
if Config.DATABASE_URL.startswith("sqlite"):
    # нужно для использования SQLite из нескольких потоков (uvicorn workers)
    connect_args = {"check_same_thread": False}

engine = create_engine(Config.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
