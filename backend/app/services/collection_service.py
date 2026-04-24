import json
import re
from datetime import datetime, UTC

from app.core.config import DB_PATH
from app.core.db import get_connection


def save_preview(player_id: int, preview: dict) -> None:
    with get_connection(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO pack_previews (id, player_id, product_code, set_code, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                preview["preview_id"],
                player_id,
                preview["product_code"],
                preview["set_code"],
                json.dumps(preview),
                preview["created_at"],
            ),
        )
        conn.commit()


def save_pack_to_collection(player_id: int, preview_id: str) -> dict:
    with get_connection(DB_PATH) as conn:
        preview_row = conn.execute(
            """
            SELECT *
            FROM pack_previews
            WHERE id = ? AND player_id = ?
            """,
            (preview_id, player_id),
        ).fetchone()

        if preview_row is None:
            raise ValueError("Preview not found for this player.")

        preview = json.loads(preview_row["payload_json"])

        cards = [entry for pack in preview["packs"] for entry in pack["cards"]]

        cursor = conn.execute(
            """
            INSERT INTO pack_history (player_id, set_code, product_code, opened_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                player_id,
                preview["set_code"],
                preview["product_code"],
                datetime.now(UTC).isoformat(),
            ),
        )
        pack_history_id = cursor.lastrowid

        for entry in cards:
            card = entry["card"]

            conn.execute(
                """
                INSERT INTO opened_cards (
                    pack_history_id, card_id, card_name, set_code, rarity,
                    slot_name, position_in_pack, image_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    pack_history_id,
                    card["id"],
                    card["name"],
                    card["set_code"],
                    card["rarity"],
                    entry["slot_name"],
                    entry["position"],
                    card["image_url"],
                ),
            )

            conn.execute(
                """
                INSERT INTO owned_cards (
                    player_id, card_id, card_name, set_code, rarity, quantity, image_url
                )
                VALUES (?, ?, ?, ?, ?, 1, ?)
                ON CONFLICT(player_id, card_id)
                DO UPDATE SET quantity = quantity + 1
                """,
                (
                    player_id,
                    card["id"],
                    card["name"],
                    card["set_code"],
                    card["rarity"],
                    card["image_url"],
                ),
            )

        conn.execute(
            """
            DELETE FROM pack_previews
            WHERE id = ? AND player_id = ?
            """,
            (preview_id, player_id),
        )

        conn.commit()

        return {
            "saved": True,
            "pack_history_id": pack_history_id,
        }


def _match_color(card: dict, wanted: str) -> bool:
    wanted = wanted.upper()
    colors = [c.upper() for c in card.get("colors", [])]
    return wanted in colors


def _match_type(card: dict, wanted: str) -> bool:
    return wanted.lower() in (card.get("type_line") or "").lower()


def _match_set(card: dict, wanted: str) -> bool:
    return (card.get("set_code") or "").lower() == wanted.lower()


def _match_mv(card: dict, operator: str, value: float) -> bool:
    mv = float(card.get("cmc") or 0)

    if operator == ":" or operator == "=":
        return mv == value
    if operator == "<":
        return mv < value
    if operator == "<=":
        return mv <= value
    if operator == ">":
        return mv > value
    if operator == ">=":
        return mv >= value

    return False


def _apply_syntax_search(cards: list[dict], search: str) -> list[dict]:
    tokens = search.strip().split()
    if not tokens:
        return cards

    plain_terms: list[str] = []

    for token in tokens:
        token_lower = token.lower()

        # type:creature or t:creature
        if token_lower.startswith("type:") or token_lower.startswith("t:"):
            wanted = token.split(":", 1)[1]
            cards = [card for card in cards if _match_type(card, wanted)]
            continue

        # color filters: c:g or color:g
        if token_lower.startswith("c:") or token_lower.startswith("color:"):
            wanted = token.split(":", 1)[1]
            if wanted:
                cards = [card for card in cards if _match_color(card, wanted)]
            continue

        # set:lea
        if token_lower.startswith("set:"):
            wanted = token.split(":", 1)[1]
            if wanted:
                cards = [card for card in cards if _match_set(card, wanted)]
            continue

        # mv<=3 / mv:3 / mv>2
        mv_match = re.match(r"^mv(<=|>=|:|=|<|>)(\d+(\.\d+)?)$", token_lower)
        if mv_match:
            operator = mv_match.group(1)
            value = float(mv_match.group(2))
            cards = [card for card in cards if _match_mv(card, operator, value)]
            continue

        # anything else becomes plain text search
        plain_terms.append(token_lower)

    for term in plain_terms:
        cards = [
            card
            for card in cards
            if term in (card["card_name"] or "").lower()
            or term in (card["type_line"] or "").lower()
            or term in (card["oracle_text"] or "").lower()
            or term in (card["set_code"] or "").lower()
        ]

    return cards


def get_collection(
    player_id: int,
    search: str = "",
    color: str = "",
    type_filter: str = "",
    sort_by: str = "name_asc",
) -> list[dict]:
    with get_connection(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT
                oc.card_id,
                oc.card_name,
                oc.set_code,
                oc.rarity,
                oc.quantity,
                oc.image_url,
                ic.type_line,
                ic.oracle_text,
                ic.cmc,
                ic.colors,
                ic.scryfall_uri,
                s.icon_svg_uri AS set_icon
            FROM owned_cards oc
            LEFT JOIN imported_cards ic ON ic.id = oc.card_id
            LEFT JOIN sets s ON s.code = oc.set_code
            WHERE oc.player_id = ?
            """,
            (player_id,),
        ).fetchall()

    cards = []
    for row in rows:
        item = dict(row)
        item["colors"] = json.loads(item["colors"] or "[]")
        item["cmc"] = item["cmc"] if item["cmc"] is not None else 0
        cards.append(item)

    # classic UI filters still work
    if color:
        cards = [
            card for card in cards
            if color.upper() in [c.upper() for c in card["colors"]]
        ]

    if type_filter:
        cards = [
            card for card in cards
            if type_filter.lower() in (card["type_line"] or "").lower()
        ]

    # new syntax-aware search
    if search.strip():
        cards = _apply_syntax_search(cards, search)

    if sort_by == "name_desc":
        cards.sort(key=lambda c: (c["card_name"] or "").lower(), reverse=True)
    elif sort_by == "mv_asc":
        cards.sort(key=lambda c: (c["cmc"], (c["card_name"] or "").lower()))
    elif sort_by == "mv_desc":
        cards.sort(key=lambda c: (c["cmc"], (c["card_name"] or "").lower()), reverse=True)
    elif sort_by == "color":
        cards.sort(key=lambda c: ("".join(c["colors"]), (c["card_name"] or "").lower()))
    elif sort_by == "type":
        cards.sort(key=lambda c: ((c["type_line"] or "").lower(), (c["card_name"] or "").lower()))
    elif sort_by == "quantity_desc":
        cards.sort(key=lambda c: (c["quantity"], (c["card_name"] or "").lower()), reverse=True)
    else:
        cards.sort(key=lambda c: (c["card_name"] or "").lower())

    return cards

def add_card_to_collection(player_id: int, card_id: str, quantity: int = 1) -> dict:
    if quantity < 1:
        raise ValueError("Quantity must be at least 1.")

    with get_connection(DB_PATH) as conn:
        card = conn.execute(
            """
            SELECT id, name, set_code, rarity, image_url
            FROM imported_cards
            WHERE id = ?
            """,
            (card_id,),
        ).fetchone()

        if card is None:
            raise ValueError("Card not found.")

        conn.execute(
            """
            INSERT INTO owned_cards (
                player_id, card_id, card_name, set_code, rarity, quantity, image_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(player_id, card_id)
            DO UPDATE SET quantity = quantity + excluded.quantity
            """,
            (
                player_id,
                card["id"],
                card["name"],
                card["set_code"],
                card["rarity"],
                quantity,
                card["image_url"],
            ),
        )
        conn.commit()

    return {"success": True}


def remove_card_from_collection(player_id: int, card_id: str, quantity: int = 1) -> dict:
    if quantity < 1:
        raise ValueError("Quantity must be at least 1.")

    with get_connection(DB_PATH) as conn:
        row = conn.execute(
            """
            SELECT quantity
            FROM owned_cards
            WHERE player_id = ? AND card_id = ?
            """,
            (player_id, card_id),
        ).fetchone()

        if row is None:
            raise ValueError("Card is not in this player's collection.")

        new_quantity = row["quantity"] - quantity

        if new_quantity > 0:
            conn.execute(
                """
                UPDATE owned_cards
                SET quantity = ?
                WHERE player_id = ? AND card_id = ?
                """,
                (new_quantity, player_id, card_id),
            )
        else:
            conn.execute(
                """
                DELETE FROM owned_cards
                WHERE player_id = ? AND card_id = ?
                """,
                (player_id, card_id),
            )

        conn.commit()

    return {"success": True}

def export_collection(player_id: int) -> dict:
    with get_connection(DB_PATH) as conn:
        player = conn.execute(
            """
            SELECT id, username, display_name
            FROM players
            WHERE id = ?
            """,
            (player_id,),
        ).fetchone()

        if player is None:
            raise ValueError("Player not found.")

        cards = conn.execute(
            """
            SELECT
                card_id,
                card_name,
                set_code,
                rarity,
                quantity,
                image_url
            FROM owned_cards
            WHERE player_id = ?
            ORDER BY card_name ASC
            """,
            (player_id,),
        ).fetchall()

    return {
        "player": dict(player),
        "exported_at": datetime.now(UTC).isoformat(),
        "cards": [dict(card) for card in cards],
    }


def import_collection(player_id: int, payload: dict) -> dict:
    cards = payload.get("cards", [])
    if not isinstance(cards, list):
        raise ValueError("Invalid import file: 'cards' must be a list.")

    imported_count = 0

    with get_connection(DB_PATH) as conn:
        player = conn.execute(
            """
            SELECT id
            FROM players
            WHERE id = ?
            """,
            (player_id,),
        ).fetchone()

        if player is None:
            raise ValueError("Player not found.")

        for card in cards:
            card_id = card.get("card_id")
            card_name = card.get("card_name")
            set_code = card.get("set_code")
            rarity = card.get("rarity")
            quantity = int(card.get("quantity", 0))
            image_url = card.get("image_url", "")

            if not card_id or not card_name or not set_code or quantity < 1:
                continue

            conn.execute(
                """
                INSERT INTO owned_cards (
                    player_id, card_id, card_name, set_code, rarity, quantity, image_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(player_id, card_id)
                DO UPDATE SET quantity = quantity + excluded.quantity
                """,
                (
                    player_id,
                    card_id,
                    card_name,
                    set_code,
                    rarity,
                    quantity,
                    image_url,
                ),
            )
            imported_count += 1

        conn.commit()

    return {
        "success": True,
        "imported_count": imported_count,
    }