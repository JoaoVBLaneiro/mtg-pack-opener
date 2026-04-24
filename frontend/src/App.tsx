import { useState } from "react";
import HomePage from "./pages/HomePage";
import OpenPackPage from "./pages/OpenPackPage";
import CollectionPage from "./pages/CollectionPage";
import HistoryPage from "./pages/HistoryPage";
import SetLoaderPage from "./pages/SetLoaderPage";
import PlayerManagerPage from "./pages/PlayerManagerPage";
import type { Player } from "./types/player";
import type { SetInfo, ProductInfo } from "./api/sets";

type Screen = "home" | "open" | "collection" | "history" | "loader" | "players";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [refreshCollectionKey, setRefreshCollectionKey] = useState(0);

  const [selectedSet, setSelectedSet] = useState<SetInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);

  function handleSavedPack() {
    setRefreshCollectionKey((prev) => prev + 1);
    setScreen("collection");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1 className="brand">MTG Pack Opener</h1>
          <p className="brand-subtitle">Chronological progression prototype</p>
        </div>

        <nav className="nav-actions">
          <button className="nav-btn" onClick={() => setScreen("home")}>
            Home
          </button>
          <button
            className="nav-btn"
            onClick={() => setScreen("open")}
            disabled={!selectedPlayer || !selectedSet || !selectedProduct}
          >
            Open Pack
          </button>
          <button
            className="nav-btn"
            onClick={() => setScreen("collection")}
            disabled={!selectedPlayer}
          >
            Collection
          </button>
          <button
            className="nav-btn"
            onClick={() => setScreen("players")}
          >
            Players
          </button>
          {/*<button
            className="nav-btn"
            onClick={() => setScreen("history")}
            disabled={!selectedPlayer}
          >
            History
          </button>
          <button className="nav-btn" onClick={() => setScreen("loader")}>
            Load Sets
          </button> */}
        </nav>
      </header>

      <main className="main-content">
        {screen === "home" && (
          <HomePage
            selectedPlayer={selectedPlayer}
            onSelectPlayer={setSelectedPlayer}
            onStartOpening={() => setScreen("open")}
            selectedSet={selectedSet}
            onSelectSet={setSelectedSet}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
          />
        )}

        {screen === "open" && selectedPlayer && selectedSet && selectedProduct && (
          <OpenPackPage
            player={selectedPlayer}
            selectedSet={selectedSet}
            selectedProduct={selectedProduct}
            onBack={() => setScreen("home")}
            onSaved={handleSavedPack}
          />
        )}

        {screen === "collection" && selectedPlayer && (
          <CollectionPage
            key={`${selectedPlayer.id}-${refreshCollectionKey}`}
            player={selectedPlayer}
          />
        )}

        {screen === "players" && (
          <PlayerManagerPage
            selectedPlayer={selectedPlayer}
            onSelectPlayer={setSelectedPlayer}
          />
        )}

        {screen === "history" && selectedPlayer && (
          <HistoryPage player={selectedPlayer} />
        )}

        {screen === "loader" && <SetLoaderPage />}

        {screen !== "home" && !selectedPlayer && (
          <div className="page">
            <div className="panel">
              <h2>No player selected</h2>
              <p className="muted">Go back home and select or create a player first.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}