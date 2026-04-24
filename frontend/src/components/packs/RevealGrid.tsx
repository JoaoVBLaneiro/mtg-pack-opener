import type { PackCard } from "../../types/card";
import RevealCard from "./RevealCard";

type Props = {
  cards: PackCard[];
  revealedIndexes: number[];
  onReveal: (index: number) => void;
};

export default function RevealGrid({ cards, revealedIndexes, onReveal }: Props) {
  return (
    <div className="reveal-grid">
      {cards.map((entry, index) => (
        <RevealCard
          key={`${entry.card.id}-${index}`}
          entry={entry}
          revealed={revealedIndexes.includes(index)}
          onReveal={() => onReveal(index)}
        />
      ))}
    </div>
  );
}