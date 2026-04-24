import { useEffect, useState } from "react";
import {
  SHADOWS,
  DEFAULT_GLOBAL_SETTINGS,
  GLOBAL_STORAGE_KEY,
  normalizeHostname,
  seedOverrideFromGlobal,
  siteStorageKey,
  type GlobalSettings,
  type SiteOverride,
} from "../../lib/constants";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FED12F] focus-visible:ring-offset-2 ${
        checked ? "bg-[#FED12F]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ShadowGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (shadow: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">
        Shadow
      </label>
      <div className="grid grid-cols-4 gap-1.5">
        {SHADOWS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`px-2 py-1.5 text-xs rounded-lg border transition-all duration-150 ${
              value === s.id
                ? "border-[#FED12F] bg-[#FFF8D9] text-[#8B6F00] font-medium shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function OpacitySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (opacity: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-medium text-gray-500">Opacity</label>
        <span className="text-xs tabular-nums text-gray-400">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min="0.05"
        max="0.8"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 accent-[#FED12F]"
      />
    </div>
  );
}

export default function App() {
  const [hostname, setHostname] = useState<string>("");
  const [normalizedHostname, setNormalizedHostname] = useState<string>("");
  const [global, setGlobal] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [override, setOverride] = useState<SiteOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab?.id) {
          setUnavailable(true);
          setLoading(false);
          return;
        }

        const response = await browser.tabs.sendMessage(tab.id, {
          type: "sunshine:getInfo",
        });

        if (!response?.hostname) {
          setUnavailable(true);
          setLoading(false);
          return;
        }

        const normalized: string =
          response.normalizedHostname ?? normalizeHostname(response.hostname);
        setHostname(response.hostname);
        setNormalizedHostname(normalized);

        const stored = await browser.storage.local.get([
          GLOBAL_STORAGE_KEY,
          siteStorageKey(normalized),
        ]);
        setGlobal(
          (stored[GLOBAL_STORAGE_KEY] as GlobalSettings | undefined) ??
            DEFAULT_GLOBAL_SETTINGS,
        );
        setOverride(
          (stored[siteStorageKey(normalized)] as SiteOverride | undefined) ??
            null,
        );
      } catch {
        // Content script not available on this page
        setUnavailable(true);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function updateGlobal(partial: Partial<GlobalSettings>) {
    const next: GlobalSettings = { ...global, ...partial };
    setGlobal(next);
    await browser.storage.local.set({ [GLOBAL_STORAGE_KEY]: next });
  }

  async function enableOverride() {
    if (!normalizedHostname) return;
    const next = seedOverrideFromGlobal(global);
    setOverride(next);
    await browser.storage.local.set({
      [siteStorageKey(normalizedHostname)]: next,
    });
  }

  async function disableOverride() {
    if (!normalizedHostname) return;
    setOverride(null);
    await browser.storage.local.remove(siteStorageKey(normalizedHostname));
  }

  async function updateOverride(partial: Partial<SiteOverride>) {
    if (!override || !normalizedHostname) return;
    const next: SiteOverride = { ...override, ...partial };
    setOverride(next);
    await browser.storage.local.set({
      [siteStorageKey(normalizedHostname)]: next,
    });
  }

  if (loading) {
    return (
      <div className="w-80 p-8 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#FED12F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="w-80 p-6 text-center">
        <p className="text-sm text-gray-400">Cannot overlay this page.</p>
      </div>
    );
  }

  const overrideActive = override !== null;

  return (
    <div className="w-80 bg-gradient-to-b from-[#FFF8D9] to-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/sunshine.svg" alt="" className="w-6 h-6" />
          <h1 className="text-base font-semibold text-gray-800 tracking-tight">
            Sunshine
          </h1>
        </div>
        <span className="text-[11px] text-gray-400 truncate max-w-[140px] font-mono">
          {hostname}
        </span>
      </div>

      <div className="px-5 pb-5 space-y-5">
        {/* Global defaults */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Enabled everywhere
            </span>
            <Toggle
              checked={global.active}
              onChange={() => updateGlobal({ active: !global.active })}
            />
          </div>

          {global.active && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <ShadowGrid
                value={global.shadow}
                onChange={(shadow) => updateGlobal({ shadow })}
              />
              <OpacitySlider
                value={global.opacity}
                onChange={(opacity) => updateGlobal({ opacity })}
              />
            </div>
          )}
        </section>

        <div className="border-t border-gray-200" />

        {/* Per-site override */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 truncate pr-2">
              Customize for{" "}
              <span className="font-mono text-gray-600">
                {normalizedHostname}
              </span>
            </span>
            <Toggle
              checked={overrideActive}
              onChange={() =>
                overrideActive ? disableOverride() : enableOverride()
              }
            />
          </div>

          {override && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Enabled here</span>
                <Toggle
                  checked={override.active}
                  onChange={() =>
                    updateOverride({ active: !override.active })
                  }
                />
              </div>
              {override.active && (
                <>
                  <ShadowGrid
                    value={override.shadow}
                    onChange={(shadow) => updateOverride({ shadow })}
                  />
                  <OpacitySlider
                    value={override.opacity}
                    onChange={(opacity) => updateOverride({ opacity })}
                  />
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
