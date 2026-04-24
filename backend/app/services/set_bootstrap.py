from app.services.scryfall_sync import preload_set
from app.services.rule_generator import write_rule_for_set

def bootstrap_set(set_code: str) -> dict:
    preload_result = preload_set(set_code)
    rule_path = write_rule_for_set(set_code)
    return {
        "preload": preload_result,
        "rule_path": str(rule_path),
    }