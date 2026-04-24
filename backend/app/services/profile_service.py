from datetime import datetime, UTC

from app.core.config import DB_PATH
from app.core.db import get_connection

def list_players() -> list[dict]:
    print("list_players: before connection")
    with get_connection(DB_PATH) as conn:
        print("list_players: after connection")
        rows = conn.execute(
            """
            SELECT id, username, display_name, created_at
            FROM players
            ORDER BY id ASC
            """
        ).fetchall()
        print("list_players: after query", len(rows))
        return [dict(row) for row in rows]

def create_player(username: str, display_name: str) -> dict:
    with get_connection(DB_PATH) as conn:
        cursor = conn.execute(
            """
            INSERT INTO players (username, display_name, created_at)
            VALUES (?, ?, ?)
            """,
            (username.strip(), display_name.strip(), datetime.now(UTC).isoformat()),
        )
        conn.commit()

        player_id = cursor.lastrowid
        row = conn.execute(
            """
            SELECT id, username, display_name, created_at
            FROM players
            WHERE id = ?
            """,
            (player_id,),
        ).fetchone()

        return dict(row)

def get_player(player_id: int) -> dict | None:
    with get_connection(DB_PATH) as conn:
        row = conn.execute(
            """
            SELECT id, username, display_name, created_at
            FROM players
            WHERE id = ?
            """,
            (player_id,),
        ).fetchone()
        return dict(row) if row else None

def delete_player(player_id: int) -> dict:
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

        # Delete pack previews
        conn.execute(
            """
            DELETE FROM pack_previews
            WHERE player_id = ?
            """,
            (player_id,),
        )

        # Delete opened cards linked through pack history
        conn.execute(
            """
            DELETE FROM opened_cards
            WHERE pack_history_id IN (
                SELECT id FROM pack_history WHERE player_id = ?
            )
            """,
            (player_id,),
        )

        # Delete pack history
        conn.execute(
            """
            DELETE FROM pack_history
            WHERE player_id = ?
            """,
            (player_id,),
        )

        # Delete owned cards
        conn.execute(
            """
            DELETE FROM owned_cards
            WHERE player_id = ?
            """,
            (player_id,),
        )

        # Delete player
        conn.execute(
            """
            DELETE FROM players
            WHERE id = ?
            """,
            (player_id,),
        )

        conn.commit()

    return {"success": True, "player_id": player_id}