from pydantic import BaseModel, Field


class OpenPackRequest(BaseModel):
    player_id: int
    product_code: str
    pack_count: int = Field(default=1, ge=1, le=24)


class SavePackRequest(BaseModel):
    player_id: int
    preview_id: str