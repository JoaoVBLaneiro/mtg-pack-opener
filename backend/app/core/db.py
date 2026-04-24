import sqlite3
from pathlib import Path

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS owned_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    card_id TEXT NOT NULL,
    card_name TEXT NOT NULL,
    set_code TEXT NOT NULL,
    rarity TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(player_id, card_id)
);

CREATE TABLE IF NOT EXISTS pack_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    set_code TEXT NOT NULL,
    product_code TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS opened_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_history_id INTEGER NOT NULL,
    card_id TEXT NOT NULL,
    card_name TEXT NOT NULL,
    set_code TEXT NOT NULL,
    rarity TEXT,
    slot_name TEXT,
    position_in_pack INTEGER,
    image_url TEXT,
    FOREIGN KEY (pack_history_id) REFERENCES pack_history(id)
);

CREATE TABLE IF NOT EXISTS pack_previews (
    id TEXT PRIMARY KEY,
    player_id INTEGER NOT NULL,
    product_code TEXT NOT NULL,
    set_code TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS sets (
    code TEXT PRIMARY KEY,
    name TEXT,
    released_at TEXT,
    icon_svg_uri TEXT
);

CREATE TABLE IF NOT EXISTS imported_cards (
    id TEXT PRIMARY KEY,
    oracle_id TEXT,
    name TEXT NOT NULL,
    set_code TEXT NOT NULL,
    set_name TEXT,
    collector_number TEXT,
    rarity TEXT,
    type_line TEXT,
    oracle_text TEXT,
    cmc REAL,
    colors TEXT,
    color_identity TEXT,
    booster INTEGER NOT NULL DEFAULT 0,
    is_basic_land INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    scryfall_uri TEXT
);

CREATE INDEX IF NOT EXISTS idx_owned_cards_player ON owned_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_pack_history_player ON pack_history(player_id);
CREATE INDEX IF NOT EXISTS idx_imported_cards_set_code ON imported_cards(set_code);
CREATE INDEX IF NOT EXISTS idx_imported_cards_set_rarity ON imported_cards(set_code, rarity);
"""

def get_connection(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with get_connection(db_path) as conn:
        conn.executescript(SCHEMA_SQL)
        conn.commit()