export interface SiteSettings {
  shadow: string;
  opacity: number;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  shadow: "005",
  opacity: 0.3,
};

export const SHADOWS = [
  { id: "005", name: "Whisper" },
  { id: "007", name: "Gentle" },
  { id: "041", name: "Dappled" },
  { id: "063", name: "Deep" },
] as const;

export function storageKey(hostname: string): string {
  return `sunshine:${hostname}`;
}

// Global settings
export const GLOBAL_STORAGE_KEY = "sunshine:global";
export interface GlobalSettings { active: boolean }
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = { active: false };

// Domain settings
export interface DomainSettings { active: boolean }
export const DEFAULT_DOMAIN_SETTINGS: DomainSettings = { active: false };

export function extractDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}

export function domainStorageKey(domain: string): string {
  return `sunshine:domain:${domain}`;
}
