export type Card = {
  id: string;
  name: string;
  set_code: string;
  rarity: string;
  image_url: string;
};

export type PackCard = {
  slot_name: string;
  position: number;
  card: Card;
};