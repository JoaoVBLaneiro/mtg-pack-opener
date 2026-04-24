import type { PackCard } from "./card";

export type PackPreview = {
  preview_id: string;
  product_code: string;
  set_code: string;
  cards: PackCard[];
  created_at: string;
};