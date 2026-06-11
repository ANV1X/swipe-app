from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from db.session import engine
from db.models import Base
from routes import products, swipes, wishlist, shared_wishlist, profile, deals, history
import os

load_dotenv()

# Создаём таблицы при старте
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swipe Fashion API", version="1.0.0")

# CORS — разрешаем все origins для Mini App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router,        prefix="/products")
app.include_router(swipes.router,          prefix="/swipe")
app.include_router(wishlist.router,        prefix="/wishlist")
app.include_router(shared_wishlist.router, prefix="/shared-wishlist")
app.include_router(profile.router,         prefix="/profile")
app.include_router(deals.router,           prefix="/deals")
app.include_router(history.router,         prefix="/history")

@app.get("/")
def root():
    return {"status": "ok", "app": "Swipe Fashion API"}

@app.get("/health")
def health():
    return {"status": "ok"}
