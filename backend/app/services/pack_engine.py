import random
import uuid
from datetime import UTC, datetime

from app.services.card_repository import get_cards_for_pool
from app.services.rule_repository import get_rule


def _draw_without_replacement(pool: list[dict], count: int) -> list[dict]:
    if count > len(pool):
        raise ValueError(
            f"Not enough cards in pool. Requested {count}, but pool only has {len(pool)}."
        )
    return random.sample(pool, count)


def open_pack(product_code: str) -> dict:
    rule = get_rule(product_code)
    set_code = rule["set_code"]

    cards = []
    position = 1

    for slot in rule["slots"]:
        slot_name = slot["name"]
        pool_name = slot["pool"]
        count = slot["count"]

        pool_cards = get_cards_for_pool(set_code, pool_name)
        chosen_cards = _draw_without_replacement(pool_cards, count)

        for card in chosen_cards:
            cards.append(
                {
                    "slot_name": slot_name,
                    "position": position,
                    "card": card,
                }
            )
            position += 1

    preview_id = str(uuid.uuid4())

    return {
        "preview_id": preview_id,
        "product_code": rule["product_code"],
        "set_code": set_code,
        "cards": cards,
        "created_at": datetime.now(UTC).isoformat(),
    }

def open_multi_pack(product_code: str, pack_count: int) -> dict:
    packs = []

    for i in range(pack_count):
        pack = open_pack(product_code)

        packs.append({
            "pack_number": i + 1,
            "cards": pack["cards"]
        })

    preview_id = str(uuid.uuid4())

    return {
        "preview_id": preview_id,
        "product_code": product_code,
        "set_code": packs[0]["cards"][0]["card"]["set_code"] if packs else "",
        "pack_count": pack_count,
        "packs": packs,
        "created_at": datetime.now(UTC).isoformat(),
    }