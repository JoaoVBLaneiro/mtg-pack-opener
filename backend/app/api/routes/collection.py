from fastapi import APIRouter, Query, HTTPException

from app.services.collection_service import get_collection

from pydantic import BaseModel
from app.services.collection_service import (
    get_collection,
    add_card_to_collection,
    remove_card_from_collection,
    export_collection,
    import_collection,
)

from app.services.card_repository import search_imported_cards

router = APIRouter(prefix="/collection", tags=["collection"])

class CollectionAdjustRequest(BaseModel):
    card_id: str
    quantity: int = 1

class CollectionImportRequest(BaseModel):
    data: dict

@router.get("/{player_id}")
def get_player_collection(
    player_id: int,
    search: str = Query(default=""),
    color: str = Query(default=""),
    type_filter: str = Query(default=""),
    sort_by: str = Query(default="name_asc"),
) -> list[dict]:
    return get_collection(
        player_id=player_id,
        search=search,
        color=color,
        type_filter=type_filter,
        sort_by=sort_by,
    )

@router.post("/{player_id}/add")
def add_to_collection(player_id: int, payload: CollectionAdjustRequest) -> dict:
    return add_card_to_collection(player_id, payload.card_id, payload.quantity)


@router.post("/{player_id}/remove")
def remove_from_collection(player_id: int, payload: CollectionAdjustRequest) -> dict:
    return remove_card_from_collection(player_id, payload.card_id, payload.quantity)

@router.get("/search/cards")
def search_cards(
    q: str = Query(default=""),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[dict]:
    return search_imported_cards(q, limit)

@router.get("/{player_id}/export")
def export_player_collection(player_id: int) -> dict:
    try:
        return export_collection(player_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{player_id}/import")
def import_player_collection(player_id: int, payload: CollectionImportRequest) -> dict:
    try:
        return import_collection(player_id, payload.data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc