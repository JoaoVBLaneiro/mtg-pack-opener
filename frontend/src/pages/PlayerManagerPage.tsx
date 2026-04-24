import { useEffect, useState } from "react";
import { deletePlayer, getPlayers } from "../api/players";
import type { Player } from "../types/player";
import { exportCollection, importCollection } from "../api/collection";

type Props = {
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player | null) => void;
};

export default function PlayerManagerPage({
  selectedPlayer,
  onSelectPlayer,
}: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPlayers() {
    setLoading(true);
    setError("");

    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayers().catch(console.error);
  }, []);

  async function handleDelete(player: Player) {
    const confirmed = window.confirm(
      `Delete player "${player.display_name}"?\n\nThis will also remove their collection, history, and previews.`
    );

    if (!confirmed) return;

    setDeletingId(player.id);
    setError("");
    setSuccess("");

    try {
      await deletePlayer(player.id);

      if (selectedPlayer?.id === player.id) {
        onSelectPlayer(null);
      }

      setSuccess(`Player "${player.display_name}" deleted.`);
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete player.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExport(player: Player) {
    try {
      const data = await exportCollection(player.id);

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${player.username}_collection.json`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(`Collection for "${player.display_name}" exported.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export collection.");
      setSuccess("");
    }
  }

  async function handleImport(player: Player, file: File | null) {
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      await importCollection(player.id, json);

      setSuccess(`Collection imported into "${player.display_name}".`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import collection.");
      setSuccess("");
    }
  }

  return (
    <div className="page">
      <div className="panel">
        <h2>Player Manager</h2>
        <p className="muted">
          Delete players from the local database if needed.
        </p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}
        {loading && <p className="loading">Loading players...</p>}

        {!loading && players.length === 0 && (
          <p className="muted">No players found.</p>
        )}

        <div className="collection-grid">
          {players.map((player) => (
            <div key={player.id} className="collection-card">
              <div className="collection-card__body">
                <strong>{player.display_name}</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  @{player.username}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => onSelectPlayer(player)}
                  >
                    Select
                  </button>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => handleDelete(player)}
                    disabled={deletingId === player.id}
                  >
                    {deletingId === player.id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() => handleExport(player)}
                    >
                      Export Collection
                    </button>

                    <label className="secondary-btn" style={{ display: "inline-flex", alignItems: "center" }}>
                      Import Collection
                      <input
                        type="file"
                        accept="application/json"
                        style={{ display: "none" }}
                        onChange={(e) => handleImport(player, e.target.files?.[0] ?? null).catch(console.error)}
                      />
                    </label>
                  </div>

                {selectedPlayer?.id === player.id && (
                  <div className="quantity-badge" style={{ marginTop: 12 }}>
                    Selected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}