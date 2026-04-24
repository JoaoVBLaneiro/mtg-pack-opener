import { apiFetch } from "./client";

export type SetLoaderResponse = {
  success?: boolean;
  set_code?: string;
  set_name?: string;
  imported_count?: number;
  released_at?: string;
  icon_svg_uri?: string;
  rule_path?: string;
  preload?: {
    set_code?: string;
    set_name?: string;
    imported_count?: number;
    released_at?: string;
    icon_svg_uri?: string;
  };
};

export function preloadSetFromUI(setCode: string) {
  return apiFetch<SetLoaderResponse>("/set-loader/preload", {
    method: "POST",
    body: JSON.stringify({ set_code: setCode }),
  });
}

export function generateRuleFromUI(setCode: string) {
  return apiFetch<SetLoaderResponse>("/set-loader/generate-rule", {
    method: "POST",
    body: JSON.stringify({ set_code: setCode }),
  });
}

export function bootstrapSetFromUI(setCode: string) {
  return apiFetch<SetLoaderResponse>("/set-loader/bootstrap", {
    method: "POST",
    body: JSON.stringify({ set_code: setCode }),
  });
}