import { useEffect, useMemo, useState } from "react";
import Button from "../components/common/Button";
import BoosterPack from "../components/packs/BoosterPack";
import RevealGrid from "../components/packs/RevealGrid";
import { openPack, savePack, type PackSession } from "../api/packs";
import type { SetInfo, ProductInfo } from "../api/sets";
import type { Player } from "../types/player";

type Props = {
  player: Player;
  selectedSet: SetInfo;
  selectedProduct: ProductInfo;
  onBack: () => void;
  onSaved: () => void;
};

export default function OpenPackPage({
  player,
  selectedSet,
  selectedProduct,
  onBack,
  onSaved,
}: Props) {
  const [packCount, setPackCount] = useState(1);
  const [session, setSession] = useState<PackSession | null>(null);
  const [currentPackIndex, setCurrentPackIndex] = useState(0);
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentPack = session?.packs[currentPackIndex] ?? null;
  useEffect(() => {
    if (!session) return;

    const packsToPreload = [
      session.packs[currentPackIndex],
      session.packs[currentPackIndex + 1],
    ].filter((pack): pack is NonNullable<typeof pack> => Boolean(pack));

    packsToPreload.forEach((pack) => {
      pack.cards.forEach((entry) => {
        const img = new Image();
        img.src = entry.card.image_url;
      });
    });
  }, [session, currentPackIndex]);

  const allRevealed = useMemo(() => {
    if (!currentPack) return false;
    return revealedIndexes.length === currentPack.cards.length;
  }, [currentPack, revealedIndexes]);

  const allOpenedCards = useMemo(() => {
    if (!session) return [];
    return session.packs.flatMap((pack) =>
      pack.cards.map((entry) => ({
        ...entry,
        pack_number: pack.pack_number,
      }))
    );
  }, [session]);

  async function handleOpenPack() {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await openPack(player.id, selectedProduct.product_code, packCount);
      setSession(data);
      setCurrentPackIndex(0);
      setRevealedIndexes([]);
      setShowSummary(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open packs.");
    } finally {
      setLoading(false);
    }
  }

  function handleReveal(index: number) {
    if (revealedIndexes.includes(index)) return;
    setRevealedIndexes((prev) => [...prev, index]);
  }

  function handleRevealAll() {
    if (!currentPack) return;
    setRevealedIndexes(currentPack.cards.map((_, index) => index));
  }

  function handleNextPack() {
    if (!session) return;

    if (currentPackIndex < session.packs.length - 1) {
      setCurrentPackIndex((prev) => prev + 1);
      setRevealedIndexes([]);
    } else {
      setShowSummary(true);
    }
  }

  async function handleSaveAll() {
    if (!session) return;

    setSaving(true);
    setError("");

    try {
      const idToSave = session.preview_id;
      if (!idToSave) {
        throw new Error("No preview ID returned by backend.");
      }

      await savePack(player.id, idToSave);
      setSuccess("All packs saved to collection.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save packs.");
    } finally {
      setSaving(false);
    }
  }

  function handleResetSession() {
    setSession(null);
    setCurrentPackIndex(0);
    setRevealedIndexes([]);
    setShowSummary(false);
    setSuccess("");
    setError("");
  }

  return (
    <div className="page">
      <div className="panel">
        <h2>Opening for {player.display_name}</h2>

        <p
          className="muted"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          {selectedSet.icon_svg_uri ? (
            <img
              src={selectedSet.icon_svg_uri}
              alt={selectedSet.code}
              style={{ width: 22, height: 22, objectFit: "contain" }}
            />
          ) : null}
          <span>
            {selectedSet.name} — {selectedProduct.label}
          </span>
        </p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {!session && (
          <>
            <div className="form-row" style={{ marginBottom: 20 }}>
              <label className="muted" htmlFor="packCount">
                Number of packs
              </label>

              <input
                id="packCount"
                type="number"
                min={1}
                max={24}
                value={packCount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isNaN(value)) return;
                  setPackCount(Math.max(1, Math.min(24, value)));
                }}
                style={{
                  minWidth: 120,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(116, 143, 191, 0.25)",
                  background: "rgba(7, 14, 24, 0.95)",
                  color: "#eef4ff",
                }}
              />
            </div>

            <div className="booster-area">
              <BoosterPack
                onOpen={handleOpenPack}
                disabled={loading}
                title={selectedSet.code.toUpperCase()}
                subtitle={selectedProduct.label}
                iconUrl={selectedSet.icon_svg_uri}
              />
            </div>
          </>
        )}

        {loading && <p className="loading">Opening packs...</p>}

        {session && !showSummary && currentPack && (
          <>
            <div className="info-grid" style={{ marginBottom: 18 }}>
              <div className="info-card">
                <div className="info-card__label">Current pack</div>
                <div className="info-card__value">
                  {currentPackIndex + 1} / {session.packs.length}
                </div>
              </div>

              <div className="info-card">
                <div className="info-card__label">Product</div>
                <div className="info-card__value">{selectedProduct.label}</div>
              </div>

              <div className="info-card">
                <div className="info-card__label">Set</div>
                <div
                  className="info-card__value"
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  {selectedSet.icon_svg_uri ? (
                    <img
                      src={selectedSet.icon_svg_uri}
                      alt={selectedSet.code}
                      style={{ width: 22, height: 22, objectFit: "contain" }}
                    />
                  ) : null}
                  <span>{selectedSet.name}</span>
                </div>
              </div>
            </div>

            <div className="actions-row">
              <Button onClick={handleRevealAll} disabled={allRevealed}>
                Reveal All
              </Button>

              <button className="secondary-btn" onClick={onBack} type="button">
                Back
              </button>

              <button
                className="secondary-btn"
                onClick={handleResetSession}
                type="button"
              >
                Cancel Session
              </button>

              <Button onClick={handleNextPack} disabled={!allRevealed}>
                {currentPackIndex < session.packs.length - 1
                  ? "Next Pack"
                  : "See All Cards"}
              </Button>
            </div>

            <div style={{ height: 16 }} />

            <RevealGrid
              cards={currentPack.cards}
              revealedIndexes={revealedIndexes}
              onReveal={handleReveal}
            />
          </>
        )}

        {session && showSummary && (
          <>
            <h3 className="section-title">All cards opened</h3>
            <p className="muted">
              You opened {session.packs.length} pack
              {session.packs.length > 1 ? "s" : ""}. Review everything below,
              then save all cards to the collection.
            </p>

            <div className="actions-row">
              <button
                className="secondary-btn"
                onClick={() => {
                  setShowSummary(false);
                  setCurrentPackIndex(0);
                  setRevealedIndexes([]);
                }}
                type="button"
              >
                Back to Pack 1
              </button>

              <button
                className="secondary-btn"
                onClick={handleResetSession}
                type="button"
              >
                Cancel Session
              </button>

              <Button onClick={handleSaveAll} disabled={saving}>
                {saving ? "Saving..." : "Save All to Collection"}
              </Button>
            </div>

            <div style={{ height: 18 }} />

            <div className="collection-grid">
              {allOpenedCards.map((entry, index) => (
                <div
                  key={`${entry.card.id}-${entry.pack_number}-${index}`}
                  className="collection-card"
                >
                  <img src={entry.card.image_url} alt={entry.card.name} loading="lazy"/>
                  <div className="collection-card__body">
                    <strong>{entry.card.name}</strong>

                    <div
                      className="muted"
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {entry.card.set_icon ? (
                        <img
                          src={entry.card.set_icon}
                          alt={entry.card.set_code}
                          style={{ width: 18, height: 18, objectFit: "contain" }}
                        />
                      ) : null}
                      <span>{entry.card.set_code.toUpperCase()}</span>
                    </div>

                    <span className="quantity-badge">Pack {entry.pack_number}</span>
                    <span className="rarity-badge">{entry.card.rarity}</span>
                    <span className="slot-badge">{entry.slot_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}