from fastapi import APIRouter, HTTPException

from app.schemas.pack import OpenPackRequest, SavePackRequest
from app.services.collection_service import save_pack_to_collection, save_preview
from app.services.pack_engine import open_pack
from app.services.profile_service import get_player
from app.services.pack_engine import open_multi_pack

router = APIRouter(prefix="/packs", tags=["packs"])


@router.post("/open")
def open_pack_route(payload: OpenPackRequest) -> dict:
    player = get_player(payload.player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found.")

    try:
        preview = open_multi_pack(payload.product_code, payload.pack_count or 1)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    save_preview(payload.player_id, preview)
    return preview


@router.post("/save")
def save_pack(payload: SavePackRequest) -> dict:
    player = get_player(payload.player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found.")

    try:
        return save_pack_to_collection(payload.player_id, payload.preview_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc