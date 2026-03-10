import { DEFAULT_SETTINGS, storageKey, type SiteSettings } from "../lib/constants";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_end",

  main() {
    const hostname = window.location.hostname;
    if (!hostname) return;

    const key = storageKey(hostname);
    let container: HTMLDivElement | null = null;
    let currentSettings: SiteSettings | null = null;

    function ensureContainer(): HTMLDivElement {
      if (container) return container;

      container = document.createElement("div");
      container.id = "sunshine-overlay";
      Object.assign(container.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "2147483647",
        pointerEvents: "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        transition: "opacity 0.5s ease-in-out",
        opacity: "0",
      });

      document.documentElement.appendChild(container);
      return container;
    }

    function applyOverlay(settings: SiteSettings) {
      currentSettings = settings;

      if (!settings.active) {
        if (container) {
          container.style.opacity = "0";
          const el = container;
          setTimeout(() => {
            el.remove();
            if (container === el) container = null;
          }, 500);
        }
        return;
      }

      const el = ensureContainer();
      const imgUrl = browser.runtime.getURL(`/shadows/${settings.shadow}.png`);
      el.style.backgroundImage = `url('${imgUrl}')`;

      // Force reflow so the transition triggers
      void el.offsetHeight;
      el.style.opacity = String(settings.opacity);
    }

    // Respond to popup info requests
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === "sunshine:getInfo") {
        return Promise.resolve({
          hostname,
          settings: currentSettings,
        });
      }
    });

    // Load initial state from storage
    browser.storage.local.get(key).then((result) => {
      const saved = result[key] as SiteSettings | undefined;
      if (saved) {
        applyOverlay(saved);
      } else {
        currentSettings = { ...DEFAULT_SETTINGS };
      }
    });

    // React to storage changes from popup
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[key]) {
        const newVal = changes[key].newValue as SiteSettings | undefined;
        applyOverlay(newVal ?? { ...DEFAULT_SETTINGS, active: false });
      }
    });
  },
});
