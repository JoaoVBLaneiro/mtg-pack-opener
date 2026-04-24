from pydantic import BaseModel

class PlayerCreate(BaseModel):
    username: str
    display_name: str

class PlayerResponse(BaseModel):
    id: int
    username: str
    display_name: str
    created_at: str