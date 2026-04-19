import { useEffect, useState } from "react";
import {
  SHADOWS,
  DEFAULT_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_DOMAIN_SETTINGS,
  GLOBAL_STORAGE_KEY,
  storageKey,
  domainStorageKey,
  type SiteSettings,
  type GlobalSettings,
  type DomainSettings,
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

export default function App() {
  const [hostname, setHostname] = useState<string>("");
  const [domain, setDomain] = useState<string>("");
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [globalActive, setGlobalActive] = useState(false);
  const [domainActive, setDomainActive] = useState(false);
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

        // Ask the content script for the hostname
        const response = await browser.tabs.sendMessage(tab.id, {
          type: "sunshine:getInfo",
        });

        if (response?.hostname) {
          setHostname(response.hostname);
          setDomain(response.domain ?? response.hostname);
          if (response.settings) {
            setSettings(response.settings);
          }
          if (response.globalSettings) {
            setGlobalActive(response.globalSettings.active);
          }
          if (response.domainSettings) {
            setDomainActive(response.domainSettings.active);
          }
        } else {
          setUnavailable(true);
        }
      } catch {
        // Content script not available on this page
        setUnavailable(true);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function updateGlobal(active: boolean) {
    setGlobalActive(active);
    const value: GlobalSettings = { active };
    await browser.storage.local.set({ [GLOBAL_STORAGE_KEY]: value });
  }

  async function updateDomain(active: boolean) {
    if (!domain) return;
    setDomainActive(active);
    const value: DomainSettings = { active };
    await browser.storage.local.set({ [domainStorageKey(domain)]: value });
  }

  async function updateSettings(partial: Partial<SiteSettings>) {
    const newSettings = { ...settings, ...partial };
    setSettings(newSettings);
    if (hostname) {
      await browser.storage.local.set({
        [storageKey(hostname)]: newSettings,
      });
    }
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
        <p className="text-sm text-gray-400">
          Cannot overlay this page.
        </p>
      </div>
    );
  }

  const overlayActive = globalActive || domainActive;

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

      <div className="px-5 pb-5 space-y-4">
        {/* Global toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Enabled everywhere</span>
          <Toggle
            checked={globalActive}
            onChange={() => updateGlobal(!globalActive)}
          />
        </div>

        {/* Domain toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Enabled on {domain}
          </span>
          <Toggle
            checked={domainActive}
            onChange={() => updateDomain(!domainActive)}
          />
        </div>

        {/* Controls (shown when overlay is active) */}
        {overlayActive && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Shadow selector */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                Shadow
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {SHADOWS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => updateSettings({ shadow: s.id })}
                    className={`px-2 py-1.5 text-xs rounded-lg border transition-all duration-150 ${
                      settings.shadow === s.id
                        ? "border-[#FED12F] bg-[#FFF8D9] text-[#8B6F00] font-medium shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Opacity
                </label>
                <span className="text-xs tabular-nums text-gray-400">
                  {Math.round(settings.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={settings.opacity}
                onChange={(e) =>
                  updateSettings({ opacity: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 accent-[#FED12F]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
