import type { PackCard } from "../../types/card";

type Props = {
  entry: PackCard;
  revealed: boolean;
  onReveal: () => void;
};

export default function RevealCard({ entry, revealed, onReveal }: Props) {
  return (
    <div className="reveal-card" onClick={onReveal}>
      {!revealed ? (
        <div className="card-back">
          <span>MTG</span>
        </div>
      ) : (
        <div className={`card-face rarity-${entry.card.rarity}`}>
          <img src={entry.card.image_url} alt={entry.card.name} />
          <div className="card-meta">
            <strong>{entry.card.name}</strong>
            <span>{entry.slot_name}</span>
          </div>
        </div>
      )}
    </div>
  );
}