from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import products, swipes, wishlist, battles, notifications, shared, users
from app.database import engine, Base
from app.scheduler import scheduler
from app.bot import dp, bot
import asyncio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swipe Fashion API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(swipes.router)
app.include_router(wishlist.router)
app.include_router(battles.router)
app.include_router(notifications.router)
app.include_router(shared.router)
app.include_router(users.router)

@app.on_event("startup")
async def startup():
    asyncio.create_task(dp.start_polling(bot))  # <-- передаём bot
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()

@app.get("/")
def read_root():
    return {"message": "Swipe Fashion API is running!"}