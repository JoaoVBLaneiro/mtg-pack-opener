import { apiFetch } from "./client";
import type { Player } from "../types/player";

export function getPlayers() {
  return apiFetch<Player[]>("/players");
}

export function createPlayer(username: string, displayName: string) {
  return apiFetch<Player>("/players", {
    method: "POST",
    body: JSON.stringify({
      username,
      display_name: displayName,
    }),
  });
}

export function deletePlayer(playerId: number) {
  return apiFetch(`/players/${playerId}`, {
    method: "DELETE",
  });
}