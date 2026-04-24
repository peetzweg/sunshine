export const SHADOWS = [
  { id: "005", name: "Whisper" },
  { id: "007", name: "Gentle" },
  { id: "041", name: "Dappled" },
  { id: "063", name: "Deep" },
] as const;

// Global defaults — apply everywhere unless a per-site override exists.
export const GLOBAL_STORAGE_KEY = "sunshine:global";

export interface GlobalSettings {
  active: boolean;
  shadow: string;
  opacity: number;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  active: false,
  shadow: "005",
  opacity: 0.3,
};

// Per-site override — presence fully replaces global for that hostname.
// Scope: normalized hostname (leading `www.` stripped) — so `www.example.com`
// and `example.com` share one override, but `app.example.com` is separate.
export interface SiteOverride {
  active: boolean;
  shadow: string;
  opacity: number;
}

export function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, "");
}

export function siteStorageKey(normalizedHostname: string): string {
  return `sunshine:site:${normalizedHostname}`;
}

// Resolve which config applies on the current page.
// If a site override exists for the hostname, it fully replaces global
// (including active/false, which is how a user disables a single site
// while global stays on). Otherwise global applies.
export function resolveOverlayConfig(
  global: GlobalSettings,
  override: SiteOverride | undefined,
): GlobalSettings | SiteOverride {
  return override ?? global;
}

// Seed a fresh site override from the current global config.
// `active` is forced to true so flipping "Customize for this site" always
// produces a visible effect — even when global is off.
export function seedOverrideFromGlobal(global: GlobalSettings): SiteOverride {
  return {
    active: true,
    shadow: global.shadow,
    opacity: global.opacity,
  };
}

// Reserved / abandoned storage prefixes from the pre-refactor schema:
//   sunshine:{hostname}        — old per-hostname { shadow, opacity }
//   sunshine:domain:{eTLD+1}   — old domain-level { active }
// Do not reuse these prefixes for new keys.
