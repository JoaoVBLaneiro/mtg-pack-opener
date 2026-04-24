from fastapi import APIRouter
from pydantic import BaseModel

from app.services.card_repository import list_supported_sets
from app.services.rule_repository import list_products_for_set

from app.services.scryfall_sync import preload_set
from app.services.rule_generator import write_rule_for_set

router = APIRouter(prefix="/sets", tags=["sets"])


@router.get("")
def get_sets() -> list[dict]:
    return list_supported_sets()


@router.get("/{set_code}/products")
def get_products_for_set(set_code: str) -> list[dict]:
    return list_products_for_set(set_code)

class SetActionRequest(BaseModel):
    set_code: str


@router.post("/bootstrap")
def bootstrap_set(payload: SetActionRequest) -> dict:
    set_code = payload.set_code.strip().lower()

    preload = preload_set(set_code)
    rule_path = write_rule_for_set(set_code)

    return {
        "success": True,
        "set_code": set_code,
        "preload": preload,
        "rule_path": str(rule_path),
    }