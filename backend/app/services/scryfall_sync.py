import json
import requests

from app.core.config import DB_PATH
from app.core.db import get_connection

SCRYFALL_SEARCH_URL = "https://api.scryfall.com/cards/search"
SCRYFALL_SET_URL = "https://api.scryfall.com/sets"


def _is_basic_land(card: dict) -> int:
    type_line = (card.get("type_line") or "").lower()
    name = (card.get("name") or "").lower()
    basic_land_names = {"plains", "island", "swamp", "mountain", "forest", "wastes"}
    return int("basic land" in type_line or name in basic_land_names)


def _get_image_url(card: dict) -> str:
    image_uris = card.get("image_uris")
    if image_uris:
        return image_uris.get("small") or image_uris.get("normal") or ""

    for face in card.get("card_faces", []):
        face_images = face.get("image_uris")
        if face_images:
            return face_images.get("small") or face_images.get("normal") or ""

    return ""


def fetch_set_metadata(set_code: str) -> dict:
    response = requests.get(f"{SCRYFALL_SET_URL}/{set_code}", timeout=30)
    response.raise_for_status()
    return response.json()


def fetch_all_cards_for_set(set_code: str) -> list[dict]:
    params = {
        "q": f"set:{set_code} game:paper",
        "unique": "prints",
        "order": "set",
        "dir": "asc",
    }

    response = requests.get(SCRYFALL_SEARCH_URL, params=params, timeout=60)
    response.raise_for_status()
    payload = response.json()

    cards = payload.get("data", [])

    while payload.get("has_more"):
        next_page = payload["next_page"]
        response = requests.get(next_page, timeout=60)
        response.raise_for_status()
        payload = response.json()
        cards.extend(payload.get("data", []))

    return cards


def import_set_from_scryfall(set_code: str) -> dict:
    set_meta = fetch_set_metadata(set_code)
    cards = fetch_all_cards_for_set(set_code)

    imported_count = 0

    with get_connection(DB_PATH) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO sets (code, name, released_at, icon_svg_uri)
            VALUES (?, ?, ?, ?)
            """,
            (
                set_meta.get("code"),
                set_meta.get("name"),
                set_meta.get("released_at"),
                set_meta.get("icon_svg_uri"),
            ),
        )

        for card in cards:
            conn.execute(
                """
                INSERT OR REPLACE INTO imported_cards (
                    id, oracle_id, name, set_code, set_name, collector_number,
                    rarity, type_line, oracle_text, cmc, colors, color_identity,
                    booster, is_basic_land, image_url, scryfall_uri
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    card.get("id"),
                    card.get("oracle_id"),
                    card.get("name"),
                    card.get("set"),
                    card.get("set_name"),
                    card.get("collector_number"),
                    card.get("rarity"),
                    card.get("type_line"),
                    card.get("oracle_text"),
                    card.get("cmc"),
                    json.dumps(card.get("colors") or []),
                    json.dumps(card.get("color_identity") or []),
                    int(bool(card.get("booster"))),
                    _is_basic_land(card),
                    _get_image_url(card),
                    card.get("scryfall_uri"),
                ),
            )
            imported_count += 1

        conn.commit()

    return {
        "set_code": set_meta.get("code"),
        "set_name": set_meta.get("name"),
        "released_at": set_meta.get("released_at"),
        "icon_svg_uri": set_meta.get("icon_svg_uri"),
        "imported_count": imported_count,
    }


def preload_set(set_code: str) -> dict:
    return import_set_from_scryfall(set_code)