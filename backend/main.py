from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from db.session import engine
from db.models import Base
from routes import products, swipes, wishlist, shared_wishlist, profile, deals, history
import os

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swipe Fashion API", version="1.0.0")

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

@app.on_event("startup")
async def startup_event():
    """При первом запуске — заполняем БД тестовыми товарами если пусто."""
    from db.session import SessionLocal
    from db.models import Product
    db = SessionLocal()
    try:
        count = db.query(Product).count()
        if count == 0:
            print("БД пустая — заполняем тестовыми товарами...")
            import sys
            sys.path.insert(0, "/app")
            from parser.seed import seed
            seed()
            from parser.seed_prices import seed_new
            seed_new()
            print(f"✅ Товары загружены")
    except Exception as e:
        print(f"Seed ошибка: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {"status": "ok", "app": "Swipe Fashion API"}

@app.get("/health")
def health():
    return {"status": "ok"}
