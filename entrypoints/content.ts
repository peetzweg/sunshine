import {
  DEFAULT_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_DOMAIN_SETTINGS,
  GLOBAL_STORAGE_KEY,
  storageKey,
  extractDomain,
  domainStorageKey,
  type SiteSettings,
  type GlobalSettings,
  type DomainSettings,
} from "../lib/constants";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",

  main() {
    const hostname = window.location.hostname;
    if (!hostname) return;

    const key = storageKey(hostname);
    const domain = extractDomain(hostname);
    const domainKey = domainStorageKey(domain);

    let currentSettings: SiteSettings = { ...DEFAULT_SETTINGS };
    let globalSettings: GlobalSettings = { ...DEFAULT_GLOBAL_SETTINGS };
    let domainSettings: DomainSettings = { ...DEFAULT_DOMAIN_SETTINGS };
    let isInitialLoad = true;

    // Create overlay IMMEDIATELY at document_start — before first paint
    const container = document.createElement("div");
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
    });

    // Apply defaults synchronously — browser.runtime.getURL() is sync
    const defaultImgUrl = browser.runtime.getURL(`/shadows/${DEFAULT_SETTINGS.shadow}.png`);
    container.style.backgroundImage = `url('${defaultImgUrl}')`;
    container.style.opacity = String(DEFAULT_SETTINGS.opacity);
    document.documentElement.appendChild(container);

    // Track whether container is still in the DOM
    let containerRef: HTMLDivElement | null = container;

    // Safety timeout — if storage never resolves, remove overlay
    const safetyTimer = setTimeout(() => {
      if (container.parentNode) {
        container.remove();
        containerRef = null;
      }
    }, 500);

    // Fetch actual settings and adjust before first paint
    browser.storage.local.get([key, GLOBAL_STORAGE_KEY, domainKey]).then((result) => {
      clearTimeout(safetyTimer);

      const savedGlobal = result[GLOBAL_STORAGE_KEY] as GlobalSettings | undefined;
      if (savedGlobal) globalSettings = savedGlobal;

      const savedDomain = result[domainKey] as DomainSettings | undefined;
      if (savedDomain) domainSettings = savedDomain;

      const savedSite = result[key] as SiteSettings | undefined;
      if (savedSite) currentSettings = savedSite;

      const isActive = globalSettings.active || domainSettings.active;
      if (isActive) {
        // Update to actual settings (may differ from defaults)
        const imgUrl = browser.runtime.getURL(`/shadows/${currentSettings.shadow}.png`);
        container.style.backgroundImage = `url('${imgUrl}')`;
        container.style.opacity = String(currentSettings.opacity);
      } else {
        // Not active — remove before first paint (user never sees it)
        container.remove();
        containerRef = null;
      }
      isInitialLoad = false;
    }).catch(() => {
      clearTimeout(safetyTimer);
      container.remove();
      containerRef = null;
    });

    // Runtime changes from popup (after initial load)
    function applyOverlay(active: boolean) {
      if (!active) {
        if (containerRef) {
          containerRef.style.transition = "opacity 0.5s ease-in-out";
          containerRef.style.opacity = "0";
          const el = containerRef;
          setTimeout(() => {
            el.remove();
            if (containerRef === el) containerRef = null;
          }, 500);
        }
        return;
      }

      // Ensure container exists (may have been removed on inactive load)
      if (!containerRef) {
        const newContainer = document.createElement("div");
        newContainer.id = "sunshine-overlay";
        Object.assign(newContainer.style, {
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
          opacity: "0",
        });
        document.documentElement.appendChild(newContainer);
        containerRef = newContainer;
      }

      const imgUrl = browser.runtime.getURL(`/shadows/${currentSettings.shadow}.png`);
      containerRef.style.backgroundImage = `url('${imgUrl}')`;
      containerRef.style.transition = "opacity 0.5s ease-in-out";
      void containerRef.offsetHeight;
      containerRef.style.opacity = String(currentSettings.opacity);
    }

    function resolveAndApply() {
      const isActive = globalSettings.active || domainSettings.active;
      applyOverlay(isActive);
    }

    // Respond to popup info requests
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === "sunshine:getInfo") {
        return Promise.resolve({
          hostname,
          domain,
          settings: currentSettings,
          globalSettings,
          domainSettings,
        });
      }
    });

    // React to storage changes from popup
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;

      let needsResolve = false;

      if (changes[GLOBAL_STORAGE_KEY]) {
        globalSettings = (changes[GLOBAL_STORAGE_KEY].newValue as GlobalSettings) ?? { ...DEFAULT_GLOBAL_SETTINGS };
        needsResolve = true;
      }

      if (changes[domainKey]) {
        domainSettings = (changes[domainKey].newValue as DomainSettings) ?? { ...DEFAULT_DOMAIN_SETTINGS };
        needsResolve = true;
      }

      if (changes[key]) {
        currentSettings = (changes[key].newValue as SiteSettings) ?? { ...DEFAULT_SETTINGS };
        needsResolve = true;
      }

      if (needsResolve) {
        resolveAndApply();
      }
    });
  },
});
