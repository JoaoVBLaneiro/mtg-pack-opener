import { apiFetch } from "./client";

export type SetInfo = {
  code: string;
  name: string;
  released_at: string;
  icon_svg_uri?: string;
};

export type ProductInfo = {
  product_code: string;
  label: string;
};

export function getSets() {
  return apiFetch<SetInfo[]>("/sets");
}

export function getProducts(setCode: string) {
  return apiFetch<ProductInfo[]>(`/sets/${setCode}/products`);
}

export function bootstrapSet(setCode: string) {
  return apiFetch("/sets/bootstrap", {
    method: "POST",
    body: JSON.stringify({ set_code: setCode }),
  });
}