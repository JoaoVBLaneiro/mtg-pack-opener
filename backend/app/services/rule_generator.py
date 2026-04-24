import json
from pathlib import Path

from app.core.config import RULES_DIR
from app.services.scryfall_sync import fetch_set_metadata

# Template groups
EARLY_CORE_SETS = {"lea", "leb", "2ed", "3ed"}
EARLY_8_CARD_EXPANSIONS = {"arn", "atq", "drk", "fem"}
LEGENDS_STYLE_SETS = {"leg"}

# Sets that need custom overrides can go here later
CUSTOM_RULES = {
    # "set_code": {...full rule dict...}
}


def _slugify_name(name: str) -> str:
    return (
        name.lower()
        .replace(":", "")
        .replace(",", "")
        .replace("'", "")
        .replace("-", "_")
        .replace(" ", "_")
    )


def _default_product_code(set_code: str, set_name: str) -> str:
    # stable but readable
    return f"{_slugify_name(set_name)}_booster"


def build_rule_for_set(set_code: str) -> dict:
    set_meta = fetch_set_metadata(set_code)
    set_name = set_meta["name"]

    if set_code in CUSTOM_RULES:
        return CUSTOM_RULES[set_code]

    product_code = _default_product_code(set_code, set_name)

    # Alpha/Beta/Unlimited/Revised style
    if set_code in EARLY_CORE_SETS:
        return {
            "product_code": product_code,
            "label": f"{set_name} Booster",
            "set_code": set_code,
            "slots": [
                {"name": "common", "count": 11, "pool": "common"},
                {"name": "uncommon", "count": 3, "pool": "uncommon"},
                {"name": "rare", "count": 1, "pool": "rare"},
            ],
        }

    # 8-card early expansions
    if set_code in EARLY_8_CARD_EXPANSIONS:
        # The Dark and Fallen Empires use sheet-aware pools in your engine
        if set_code in {"drk", "fem"}:
            return {
                "product_code": product_code,
                "label": f"{set_name} Booster",
                "set_code": set_code,
                "slots": [
                    {"name": "common", "count": 6, "pool": "common_sheet"},
                    {"name": "uncommon", "count": 2, "pool": "uncommon_sheet"},
                ],
            }

        return {
            "product_code": product_code,
            "label": f"{set_name} Booster",
            "set_code": set_code,
            "slots": [
                {"name": "common", "count": 6, "pool": "common"},
                {"name": "uncommon", "count": 2, "pool": "uncommon"},
            ],
        }

    # Legends gets its own bucket because it is ratio-correct but may later want sheet overrides
    if set_code in LEGENDS_STYLE_SETS:
        return {
            "product_code": product_code,
            "label": f"{set_name} Booster",
            "set_code": set_code,
            "slots": [
                {"name": "common", "count": 11, "pool": "common"},
                {"name": "uncommon", "count": 3, "pool": "uncommon"},
                {"name": "rare", "count": 1, "pool": "rare"},
            ],
        }

    # Fallback: classic 15-card rare/uncommon/common structure
    return {
        "product_code": product_code,
        "label": f"{set_name} Booster",
        "set_code": set_code,
        "slots": [
            {"name": "common", "count": 11, "pool": "common"},
            {"name": "uncommon", "count": 3, "pool": "uncommon"},
            {"name": "rare", "count": 1, "pool": "rare"},
        ],
    }


def write_rule_for_set(set_code: str) -> Path:
    rule = build_rule_for_set(set_code)
    RULES_DIR.mkdir(parents=True, exist_ok=True)

    output_path = RULES_DIR / f"{rule['product_code']}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(rule, f, indent=2)

    return output_path


def write_rules_for_sets(set_codes: list[str]) -> list[Path]:
    paths = []
    for set_code in set_codes:
        paths.append(write_rule_for_set(set_code))
    return paths