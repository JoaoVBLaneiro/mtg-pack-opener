from app.core.config import DB_PATH
from app.core.db import get_connection


def get_set_icon(set_code: str) -> str:
    with get_connection(DB_PATH) as conn:
        row = conn.execute(
            """
            SELECT icon_svg_uri
            FROM sets
            WHERE code = ?
            """,
            (set_code,),
        ).fetchone()

    return row["icon_svg_uri"] if row and row["icon_svg_uri"] else ""


def get_cards_for_pool(set_code: str, pool_name: str) -> list[dict]:
    with get_connection(DB_PATH) as conn:
        if pool_name == "rare":
            rows = conn.execute(
                """
                SELECT id, name, set_code, rarity, image_url
                FROM imported_cards
                WHERE set_code = ?
                  AND rarity = 'rare'
                ORDER BY collector_number
                """,
                (set_code,),
            ).fetchall()

        elif pool_name == "uncommon":
            rows = conn.execute(
                """
                SELECT id, name, set_code, rarity, image_url
                FROM imported_cards
                WHERE set_code = ?
                  AND rarity = 'uncommon'
                ORDER BY collector_number
                """,
                (set_code,),
            ).fetchall()

        elif pool_name == "common":
            rows = conn.execute(
                """
                SELECT id, name, set_code, rarity, image_url
                FROM imported_cards
                WHERE set_code = ?
                  AND rarity = 'common'
                ORDER BY collector_number
                """,
                (set_code,),
            ).fetchall()

        elif pool_name == "basic_land":
            rows = conn.execute(
                """
                SELECT id, name, set_code, rarity, image_url
                FROM imported_cards
                WHERE set_code = ?
                  AND is_basic_land = 1
                ORDER BY collector_number
                """,
                (set_code,),
            ).fetchall()

        else:
            raise ValueError(f"Unsupported pool '{pool_name}'")

        cards = [dict(row) for row in rows]

    if not cards:
        raise ValueError(
            f"No imported cards found for set_code='{set_code}' and pool='{pool_name}'. "
            f"Did you preload the set first?"
        )

    set_icon = get_set_icon(set_code)

    return [
        {
            **card,
            "set_icon": set_icon,
        }
        for card in cards
    ]


def list_supported_sets() -> list[dict]:
    with get_connection(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT code, name, released_at, icon_svg_uri
            FROM sets
            ORDER BY released_at ASC, code ASC
            """
        ).fetchall()

    return [
        {
            "code": row["code"],
            "name": row["name"],
            "released_at": row["released_at"] or "",
            "icon_svg_uri": row["icon_svg_uri"] or "",
        }
        for row in rows
    ]

def search_imported_cards(search: str, limit: int = 20) -> list[dict]:
    search = search.strip()
    if not search:
        return []

    with get_connection(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT
                ic.id,
                ic.name,
                ic.set_code,
                ic.rarity,
                ic.type_line,
                ic.cmc,
                ic.colors,
                ic.image_url,
                ic.scryfall_uri,
                s.icon_svg_uri AS set_icon
            FROM imported_cards ic
            LEFT JOIN sets s ON s.code = ic.set_code
            WHERE lower(ic.name) LIKE ?
            ORDER BY ic.name ASC
            LIMIT ?
            """,
            (f"%{search.lower()}%", limit),
        ).fetchall()

    import json

    results = []
    for row in rows:
        item = dict(row)
        item["colors"] = json.loads(item["colors"] or "[]")
        item["cmc"] = item["cmc"] if item["cmc"] is not None else 0
        results.append(item)

    return results