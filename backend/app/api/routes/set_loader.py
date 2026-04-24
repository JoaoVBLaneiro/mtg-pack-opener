from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.scryfall_sync import preload_set
from app.services.rule_generator import write_rule_for_set

router = APIRouter(prefix="/set-loader", tags=["set_loader"])


class SetCodeRequest(BaseModel):
    set_code: str


@router.post("/preload")
def preload_set_route(payload: SetCodeRequest) -> dict:
    set_code = payload.set_code.strip().lower()
    if not set_code:
        raise HTTPException(status_code=400, detail="set_code is required.")

    try:
        return preload_set(set_code)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/generate-rule")
def generate_rule_route(payload: SetCodeRequest) -> dict:
    set_code = payload.set_code.strip().lower()
    if not set_code:
        raise HTTPException(status_code=400, detail="set_code is required.")

    try:
        rule_path = write_rule_for_set(set_code)
        return {
            "success": True,
            "set_code": set_code,
            "rule_path": str(rule_path),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/bootstrap")
def bootstrap_set_route(payload: SetCodeRequest) -> dict:
    set_code = payload.set_code.strip().lower()
    if not set_code:
        raise HTTPException(status_code=400, detail="set_code is required.")

    try:
        preload_result = preload_set(set_code)
        rule_path = write_rule_for_set(set_code)

        return {
            "success": True,
            "set_code": set_code,
            "preload": preload_result,
            "rule_path": str(rule_path),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc