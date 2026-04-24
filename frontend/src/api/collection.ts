import { apiFetch } from "./client";

export type CollectionEntry = {
  card_id: string;
  card_name: string;
  set_code: string;
  rarity: string;
  image_url: string;
  quantity: number;
  type_line?: string;
  oracle_text?: string;
  cmc?: number;
  colors: string[];
  set_icon?: string;
  scryfall_uri?: string;
};

export type CollectionQuery = {
  search?: string;
  color?: string;
  type_filter?: string;
  sort_by?: string;
};

export function getCollection(playerId: number, query: CollectionQuery = {}) {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.color) params.set("color", query.color);
  if (query.type_filter) params.set("type_filter", query.type_filter);
  if (query.sort_by) params.set("sort_by", query.sort_by);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<CollectionEntry[]>(`/collection/${playerId}${suffix}`);
}

export function addToCollection(playerId: number, cardId: string, quantity = 1) {
  return apiFetch(`/collection/${playerId}/add`, {
    method: "POST",
    body: JSON.stringify({
      card_id: cardId,
      quantity,
    }),
  });
}

export function removeFromCollection(playerId: number, cardId: string, quantity = 1) {
  return apiFetch(`/collection/${playerId}/remove`, {
    method: "POST",
    body: JSON.stringify({
      card_id: cardId,
      quantity,
    }),
  });
}

export type ImportedCardSearchResult = {
  id: string;
  name: string;
  set_code: string;
  rarity: string;
  type_line?: string;
  cmc?: number;
  colors: string[];
  image_url: string;
  scryfall_uri?: string;
  set_icon?: string;
};

export function searchImportedCards(query: string, limit = 20) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("limit", String(limit));

  return apiFetch<ImportedCardSearchResult[]>(
    `/collection/search/cards?${params.toString()}`
  );
}

export function exportCollection(playerId: number) {
  return apiFetch(`/collection/${playerId}/export`);
}

export function importCollection(playerId: number, data: unknown) {
  return apiFetch(`/collection/${playerId}/import`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}