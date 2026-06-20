from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Config
from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.routers import (
    products, swipes, wishlist, collections, battles, friends,
    notifications, shared_wishlists, profile, users, admin,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Swipe App API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(swipes.router)
app.include_router(wishlist.router)
app.include_router(collections.router)
app.include_router(battles.router)
app.include_router(friends.router)
app.include_router(notifications.router)
app.include_router(shared_wishlists.router)
app.include_router(profile.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "swipe-app-api"}


@app.get("/health")
def health():
    return {"status": "healthy"}
