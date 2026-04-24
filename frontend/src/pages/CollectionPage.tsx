import { useEffect, useState } from "react";
import {
  getCollection,
  addToCollection,
  removeFromCollection,
  searchImportedCards,
  type CollectionEntry,
  type ImportedCardSearchResult,
} from "../api/collection";
import type { Player } from "../types/player";

type Props = {
  player: Player;
};

export default function CollectionPage({ player }: Props) {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [color, setColor] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  const [addSearch, setAddSearch] = useState("");
  const [addResults, setAddResults] = useState<ImportedCardSearchResult[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const [hoveredCard, setHoveredCard] = useState<CollectionEntry | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  async function reloadCollection() {
  setLoading(true);
  setError("");
  try {
    const data = await getCollection(player.id, {
      search,
      color,
      type_filter: typeFilter,
      sort_by: sortBy,
    });
    setEntries(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load collection.");
  } finally {
    setLoading(false);
  }
}

  async function handleAdd(cardId: string) {
    try {
      await addToCollection(player.id, cardId, 1);
      await reloadCollection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card.");
    }
  }

  async function handleRemove(cardId: string) {
    try {
      await removeFromCollection(player.id, cardId, 1);
      await reloadCollection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove card.");
    }
  }

  async function handleSearchToAdd() {
    if (!addSearch.trim()) {
      setAddResults([]);
      return;
    }

    setAddLoading(true);
    setError("");

    try {
      const data = await searchImportedCards(addSearch, 20);
      setAddResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search cards.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAddBySearch(cardId: string) {
    try {
      await addToCollection(player.id, cardId, 1);
      await reloadCollection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card.");
    }
  }

  useEffect(() => {
    reloadCollection().catch(console.error);
  }, [player.id, search, color, typeFilter, sortBy]);

  return (
    <div className="page">
      <div className="panel">
        <h2>{player.display_name}'s Collection</h2>
        <p className="muted">
          Search by card name, rules text, type, or set. Filter by color and type. Sort however you want.
        </p>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <input
            className="search-input"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              minWidth: 140,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(116, 143, 191, 0.25)",
              background: "rgba(7, 14, 24, 0.95)",
              color: "#eef4ff",
            }}
          >
            <option value="">All colors</option>
            <option value="W">White</option>
            <option value="U">Blue</option>
            <option value="B">Black</option>
            <option value="R">Red</option>
            <option value="G">Green</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              minWidth: 160,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(116, 143, 191, 0.25)",
              background: "rgba(7, 14, 24, 0.95)",
              color: "#eef4ff",
            }}
          >
            <option value="">All types</option>
            <option value="creature">Creature</option>
            <option value="instant">Instant</option>
            <option value="sorcery">Sorcery</option>
            <option value="enchantment">Enchantment</option>
            <option value="artifact">Artifact</option>
            <option value="land">Land</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              minWidth: 180,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(116, 143, 191, 0.25)",
              background: "rgba(7, 14, 24, 0.95)",
              color: "#eef4ff",
            }}
          >
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="mv_asc">Mana Value Low–High</option>
            <option value="mv_desc">Mana Value High–Low</option>
            <option value="color">Color</option>
            <option value="type">Type</option>
            <option value="quantity_desc">Quantity</option>
          </select>
        </div>

        <div className="panel" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Add card to collection</h3>

          <div className="form-row" style={{ marginBottom: 12 }}>
            <input
              className="search-input"
              placeholder="Search any imported card by name..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchToAdd().catch(console.error);
                }
              }}
            />
            <button
              className="secondary-btn"
              type="button"
              onClick={() => handleSearchToAdd().catch(console.error)}
            >
              Search
            </button>
          </div>

          {addLoading && <p className="loading">Searching cards...</p>}

          {!addLoading && addResults.length > 0 && (
            <div className="collection-grid">
              {addResults.map((card) => (
                <div key={card.id} className="collection-card">
                  <a
                    href={card.scryfall_uri}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <img src={card.image_url} alt={card.name} />
                  </a>

                  <div className="collection-card__body">
                    <a
                      href={card.scryfall_uri}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      <strong>{card.name}</strong>
                    </a>

                    <div
                      className="muted"
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {card.set_icon ? (
                        <img
                          src={card.set_icon}
                          alt={card.set_code}
                          style={{ width: 18, height: 18, objectFit: "contain" }}
                        />
                      ) : null}
                      <span>{card.set_code.toUpperCase()}</span>
                    </div>

                    <div className="muted" style={{ marginTop: 6 }}>
                      {card.type_line || "Unknown type"}
                    </div>

                    <div className="muted" style={{ marginTop: 4 }}>
                      MV {card.cmc ?? 0} • {card.colors.length ? card.colors.join("") : "Colorless"}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => handleAddBySearch(card.id).catch(console.error)}
                      >
                        Add to Collection
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && <p className="loading">Loading collection...</p>}
        {error && <div className="error-box">{error}</div>}

        {!loading && !error && entries.length === 0 && (
          <p className="muted">No matching cards found.</p>
        )}

        <div className="collection-grid">
          {entries.map((entry) => (
            <div key={entry.card_id} className="collection-card">
              <div
                key={entry.card_id}
                className="collection-card"
                onMouseEnter={() => setHoveredCard(entry)}
                onMouseLeave={() => setHoveredCard(null)}
                onMouseMove={handleMouseMove}
              >
                <a
                  href={entry.scryfall_uri}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <img src={entry.image_url} alt={entry.card_name}/>
                </a>
              </div>
              <div className="collection-card__body">
                <a
                  href={entry.scryfall_uri}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <strong>{entry.card_name}</strong>
                </a>

                <div
                  className="muted"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {entry.set_icon ? (
                    <img
                      src={entry.set_icon}
                      alt={entry.set_code}
                      style={{ width: 18, height: 18, objectFit: "contain" }}
                    />
                  ) : null}
                  <span>{entry.set_code.toUpperCase()}</span>
                </div>

                <div className="muted" style={{ marginTop: 6 }}>
                  {entry.type_line || "Unknown type"}
                </div>

                <div className="muted" style={{ marginTop: 4 }}>
                  MV {entry.cmc ?? 0} • {entry.colors.length ? entry.colors.join("") : "Colorless"}
                </div>

                <span className="quantity-badge">x{entry.quantity}</span>
                <span className="rarity-badge">{entry.rarity}</span>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => handleRemove(entry.card_id)}
                  >
                    -1
                  </button>
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => handleAdd(entry.card_id)}
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    
    {hoveredCard && (
      <div
        className="floating-preview"
        style={{
          top: mousePos.y + 10,
          left:
            mousePos.x + 420 > window.innerWidth
              ? mousePos.x - 420
              : mousePos.x + 20,
        }}
      >
        <img src={hoveredCard.image_url} alt={hoveredCard.card_name} />
      </div>
    )}
    </div>
  );

  function handleMouseMove(e: React.MouseEvent) {
  setMousePos({
    x: e.clientX,
    y: e.clientY,
  });
}

}