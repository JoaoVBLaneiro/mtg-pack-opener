import json
from pathlib import Path

RULES_DIR = Path(__file__).resolve().parent.parent / "rules"


def _load_rule_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_rule(product_code: str) -> dict:
    rule_path = RULES_DIR / f"{product_code}.json"
    if not rule_path.exists():
        raise ValueError(f"Rule not found for product_code='{product_code}'")
    return _load_rule_file(rule_path)


def list_rules() -> list[dict]:
    rules = []
    for path in RULES_DIR.glob("*.json"):
        try:
            rules.append(_load_rule_file(path))
        except Exception:
            continue
    return sorted(rules, key=lambda r: (r.get("set_code", ""), r.get("product_code", "")))


def list_products_for_set(set_code: str) -> list[dict]:
    products = []
    for rule in list_rules():
        if rule.get("set_code") == set_code:
            products.append(
                {
                    "product_code": rule["product_code"],
                    "label": rule.get("label", rule["product_code"]),
                }
            )
    return products