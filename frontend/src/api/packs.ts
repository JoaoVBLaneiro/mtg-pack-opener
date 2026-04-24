import { apiFetch } from "./client";

type CardData = {
  id: string;
  name: string;
  set_code: string;
  rarity: string;
  image_url: string;
  set_icon?: string;
};

type PackCardEntry = {
  slot_name: string;
  position: number;
  card: CardData;
};

type PackEntry = {
  pack_number: number;
  cards: PackCardEntry[];
};

export type PackSession = {
  preview_id: string;
  product_code: string;
  set_code: string;
  pack_count: number;
  packs: PackEntry[];
  created_at: string;
};

type SavePackResponse = {
  saved?: boolean;
  pack_history_id?: number;
};

export function openPack(playerId: number, productCode: string, packCount = 1) {
  return apiFetch<PackSession>("/packs/open", {
    method: "POST",
    body: JSON.stringify({
      player_id: playerId,
      product_code: productCode,
      pack_count: packCount,
    }),
  });
}

export function savePack(playerId: number, previewId: string) {
  return apiFetch<SavePackResponse>("/packs/save", {
    method: "POST",
    body: JSON.stringify({
      player_id: playerId,
      preview_id: previewId,
    }),
  });
}