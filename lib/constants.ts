export interface SiteSettings {
  active: boolean;
  shadow: string;
  opacity: number;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  active: false,
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
