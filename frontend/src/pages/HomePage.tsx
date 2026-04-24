import { useEffect, useMemo, useState } from "react";
import Button from "../components/common/Button";
import { createPlayer, getPlayers } from "../api/players";
import { getProducts, getSets, type ProductInfo, type SetInfo } from "../api/sets";
import type { Player } from "../types/player";

type Props = {
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onStartOpening: () => void;

  selectedSet: SetInfo | null;
  onSelectSet: (setItem: SetInfo) => void;

  selectedProduct: ProductInfo | null;
  onSelectProduct: (product: ProductInfo) => void;
};

export default function HomePage({
  selectedPlayer,
  onSelectPlayer,
  onStartOpening,
  selectedSet,
  onSelectSet,
  selectedProduct,
  onSelectProduct,
}: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sets, setSetsState] = useState<SetInfo[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);

  async function loadPlayers() {
    const data = await getPlayers();
    setPlayers(data);
  }

  async function loadSets() {
    const data = await getSets();
    setSetsState(data);

    if (data.length > 0 && !selectedSet) {
      onSelectSet(data[0]);
    }
  }

  async function loadProducts(setCode: string) {
    const data = await getProducts(setCode);
    setProducts(data);

    if (data.length > 0) {
      if (
        !selectedProduct ||
        !data.some((p) => p.product_code === selectedProduct.product_code)
      ) {
        onSelectProduct(data[0]);
      }
    } else {
      setProducts([]);
    }
  }

  useEffect(() => {
    async function boot() {
      setError("");
      try {
        await Promise.all([loadPlayers(), loadSets()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load home data.");
      }
    }

    boot().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSet?.code) return;

    loadProducts(selectedSet.code).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSet?.code]);

  async function handleCreatePlayer() {
    if (!username.trim() || !displayName.trim()) return;

    setLoading(true);
    setError("");

    try {
      const player = await createPlayer(username.trim(), displayName.trim());
      await loadPlayers();
      onSelectPlayer(player);
      setUsername("");
      setDisplayName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create player.");
    } finally {
      setLoading(false);
    }
  }

  const currentSet = useMemo(
    () => sets.find((setItem) => setItem.code === selectedSet?.code) ?? selectedSet,
    [sets, selectedSet]
  );

  return (
    <div className="page">
      <section className="hero">
        <h2>Build your progression collection</h2>
        <p>Pick a player, choose a set in order, and grow each collection pack by pack.</p>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="panel">
        <h3 className="section-title">Players</h3>

        {players.length === 0 ? (
          <p className="muted">No players yet. Create one below to get started.</p>
        ) : (
          <div className="player-list">
            {players.map((player) => (
              <button
                key={player.id}
                className={`player-chip ${selectedPlayer?.id === player.id ? "active" : ""}`}
                onClick={() => onSelectPlayer(player)}
                type="button"
              >
                {player.display_name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="section-title">Create player</h3>

        <div className="form-row">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Button onClick={handleCreatePlayer} disabled={loading}>
            {loading ? "Creating..." : "Create Player"}
          </Button>
        </div>
      </section>

      <section className="panel">
        <h3 className="section-title">Open your next pack</h3>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="muted" htmlFor="setSelect">
              Set
            </label>
            <select
              id="setSelect"
              value={selectedSet?.code ?? ""}
              onChange={(e) => {
                const next = sets.find((setItem) => setItem.code === e.target.value);
                if (next) onSelectSet(next);
              }}
              style={{
                minWidth: 280,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(116, 143, 191, 0.25)",
                background: "rgba(7, 14, 24, 0.95)",
                color: "#eef4ff",
              }}
            >
              {sets.map((setItem) => (
                <option key={setItem.code} value={setItem.code}>
                  {setItem.name} ({setItem.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="muted" htmlFor="productSelect">
              Product
            </label>
            <select
              id="productSelect"
              value={selectedProduct?.product_code ?? ""}
              onChange={(e) => {
                const next = products.find((product) => product.product_code === e.target.value);
                if (next) onSelectProduct(next);
              }}
              style={{
                minWidth: 280,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(116, 143, 191, 0.25)",
                background: "rgba(7, 14, 24, 0.95)",
                color: "#eef4ff",
              }}
            >
              {products.map((product) => (
                <option key={product.product_code} value={product.product_code}>
                  {product.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <div className="info-card__label">Current set</div>
            <div
              className="info-card__value"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              {currentSet?.icon_svg_uri ? (
                <img
                  src={currentSet.icon_svg_uri}
                  alt={currentSet.code}
                  style={{ width: 24, height: 24, objectFit: "contain" }}
                />
              ) : null}
              <span>{currentSet ? currentSet.name : "No set selected"}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card__label">Current product</div>
            <div className="info-card__value">
              {selectedProduct ? selectedProduct.label : "No product selected"}
            </div>
          </div>

          <div className="info-card">
            <div className="info-card__label">Selected player</div>
            <div className="info-card__value">
              {selectedPlayer ? selectedPlayer.display_name : "None selected"}
            </div>
          </div>
        </div>

        <div className="spacer-16" />

        <Button onClick={onStartOpening} disabled={!selectedPlayer || !selectedProduct}>
          Open Pack
        </Button>
      </section>
    </div>
  );
}