from fastapi import APIRouter, HTTPException

from app.schemas.player import PlayerCreate
from app.services.profile_service import create_player, get_player, list_players, delete_player

router = APIRouter(prefix="/players", tags=["players"])

@router.get("")
def get_players() -> list[dict]:
    return list_players()

@router.post("")
def post_player(payload: PlayerCreate) -> dict:
    try:
        return create_player(payload.username, payload.display_name)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get("/{player_id}")
def get_player_by_id(player_id: int) -> dict:
    player = get_player(player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found.")
    return player

@router.delete("/{player_id}")
def delete_player_route(player_id: int) -> dict:
    try:
        return delete_player(player_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc