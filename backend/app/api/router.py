from fastapi import APIRouter

from app.api.routes.collection import router as collection_router
from app.api.routes.health import router as health_router
from app.api.routes.packs import router as packs_router
from app.api.routes.players import router as players_router
from app.api.routes.sets import router as sets_router
from app.api.routes.set_loader import router as set_loader_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(players_router)
api_router.include_router(sets_router)
api_router.include_router(set_loader_router)
api_router.include_router(packs_router)
api_router.include_router(collection_router)