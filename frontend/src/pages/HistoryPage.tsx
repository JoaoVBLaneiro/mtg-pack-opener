import { useEffect, useState } from "react";
import { getCollection } from "../api/collection";
import type { Player } from "../types/player";

type CollectionEntry = {
  card_id: string;
  card_name: string;
  set_code: string;
  rarity: string;
  image_url: string;
  quantity: number;
};

type Props = {
  player: Player;
};

export default function HistoryPage({ player }: Props) {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getCollection(player.id);
        setEntries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history.");
      } finally {
        setLoading(false);
      }
    }

    load().catch(console.error);
  }, [player.id]);

  return (
    <div className="page">
      <div className="panel">
        <h2>{player.display_name}'s Pack History</h2>
        <p className="muted">
          Temporary v1 page. For now, this shows the current collected cards as a simple history-like
          view. Later we can hook this to real pack_history and opened_cards.
        </p>

        {loading && <p className="loading">Loading history...</p>}
        {error && <div className="error-box">{error}</div>}

        <div className="history-grid">
          {entries.map((entry) => (
            <div key={entry.card_id} className="history-card">
              <div className="history-card__body">
                <strong>{entry.card_name}</strong>
                <div className="muted">{entry.set_code.toUpperCase()}</div>
                <span className="quantity-badge">Owned: {entry.quantity}</span>
                <span className="rarity-badge">{entry.rarity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}