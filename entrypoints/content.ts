import {
  DEFAULT_GLOBAL_SETTINGS,
  GLOBAL_STORAGE_KEY,
  normalizeHostname,
  resolveOverlayConfig,
  siteStorageKey,
  type GlobalSettings,
  type SiteOverride,
} from "../lib/constants";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",

  main() {
    const hostname = window.location.hostname;
    if (!hostname) return;

    const normalizedHostname = normalizeHostname(hostname);
    const siteKey = siteStorageKey(normalizedHostname);

    let global: GlobalSettings = { ...DEFAULT_GLOBAL_SETTINGS };
    let override: SiteOverride | undefined;

    const TRANSITION_MS = 500;
    const TRANSITION_CSS = `opacity ${TRANSITION_MS}ms ease-in-out`;

    function resolved(): GlobalSettings | SiteOverride {
      return resolveOverlayConfig(global, override);
    }

    function styleOverlay(el: HTMLDivElement) {
      Object.assign(el.style, {
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
    }

    // Create overlay IMMEDIATELY at document_start — before first paint.
    // Start at opacity 0 so we never flash a wrong shadow; fade in only once
    // storage resolves with the real resolved config.
    const container = document.createElement("div");
    container.id = "sunshine-overlay";
    styleOverlay(container);

    // Preload the default shadow image into the element so cache is warm.
    // browser.runtime.getURL() is sync.
    const defaultImgUrl = browser.runtime.getURL(
      `/shadows/${DEFAULT_GLOBAL_SETTINGS.shadow}.png`,
    );
    container.style.backgroundImage = `url('${defaultImgUrl}')`;
    container.style.opacity = "0";
    container.dataset.shadow = DEFAULT_GLOBAL_SETTINGS.shadow;
    document.documentElement.appendChild(container);

    let containerRef: HTMLDivElement | null = container;

    // Safety timeout — if storage never resolves, remove overlay
    const safetyTimer = setTimeout(() => {
      if (container.parentNode) {
        container.remove();
        containerRef = null;
      }
    }, 500);

    // Fetch actual settings and adjust before first paint
    browser.storage.local
      .get([GLOBAL_STORAGE_KEY, siteKey])
      .then((result) => {
        clearTimeout(safetyTimer);

        const savedGlobal = result[GLOBAL_STORAGE_KEY] as
          | GlobalSettings
          | undefined;
        if (savedGlobal) global = savedGlobal;

        override = result[siteKey] as SiteOverride | undefined;

        const r = resolved();
        if (r.active) {
          const imgUrl = browser.runtime.getURL(`/shadows/${r.shadow}.png`);
          container.style.backgroundImage = `url('${imgUrl}')`;
          container.style.transition = TRANSITION_CSS;
          container.dataset.shadow = r.shadow;
          // Force layout before fading opacity up so the transition runs.
          void container.offsetHeight;
          container.style.opacity = String(r.opacity);
        } else {
          container.remove();
          containerRef = null;
        }
      })
      .catch(() => {
        clearTimeout(safetyTimer);
        container.remove();
        containerRef = null;
      });

    // Runtime changes from popup (after initial load)
    function applyOverlay(active: boolean) {
      if (!active) {
        if (containerRef) {
          const el = containerRef;
          containerRef = null;
          el.style.transition = TRANSITION_CSS;
          el.style.opacity = "0";
          setTimeout(() => el.remove(), TRANSITION_MS);
        }
        return;
      }

      const r = resolved();
      const imgUrl = browser.runtime.getURL(`/shadows/${r.shadow}.png`);
      const nextBg = `url('${imgUrl}')`;
      const nextOpacity = String(r.opacity);

      // No current overlay — fade a fresh one in
      if (!containerRef) {
        const el = document.createElement("div");
        el.id = "sunshine-overlay";
        styleOverlay(el);
        el.style.backgroundImage = nextBg;
        el.style.opacity = "0";
        el.style.transition = TRANSITION_CSS;
        el.dataset.shadow = r.shadow;
        document.documentElement.appendChild(el);
        containerRef = el;
        void el.offsetHeight;
        el.style.opacity = nextOpacity;
        return;
      }

      const sameShadow = containerRef.dataset.shadow === r.shadow;
      if (sameShadow) {
        // Only opacity changed — transition in place
        containerRef.style.transition = TRANSITION_CSS;
        containerRef.style.opacity = nextOpacity;
        containerRef.dataset.shadow = r.shadow;
        return;
      }

      // Shadow image changed — cross-fade a new layer in, drop the old one
      const oldEl = containerRef;
      const newEl = document.createElement("div");
      newEl.id = "sunshine-overlay";
      styleOverlay(newEl);
      newEl.style.backgroundImage = nextBg;
      newEl.style.opacity = "0";
      newEl.style.transition = TRANSITION_CSS;
      newEl.dataset.shadow = r.shadow;

      oldEl.removeAttribute("id");
      document.documentElement.appendChild(newEl);
      containerRef = newEl;

      void newEl.offsetHeight;
      newEl.style.opacity = nextOpacity;
      oldEl.style.transition = TRANSITION_CSS;
      oldEl.style.opacity = "0";
      setTimeout(() => oldEl.remove(), TRANSITION_MS);
    }

    function resolveAndApply() {
      applyOverlay(resolved().active);
    }

    // Respond to popup info requests
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === "sunshine:getInfo") {
        return Promise.resolve({
          hostname,
          normalizedHostname,
          global,
          override,
        });
      }
    });

    // React to storage changes from popup
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;

      let needsResolve = false;

      if (changes[GLOBAL_STORAGE_KEY]) {
        global =
          (changes[GLOBAL_STORAGE_KEY].newValue as GlobalSettings) ??
          { ...DEFAULT_GLOBAL_SETTINGS };
        needsResolve = true;
      }

      if (changes[siteKey]) {
        const newValue = changes[siteKey].newValue as
          | SiteOverride
          | undefined;
        // newValue === undefined means the override key was removed
        // (popup turned "Customize for this site" off) — reset to inherit.
        override = newValue;
        needsResolve = true;
      }

      if (needsResolve) {
        resolveAndApply();
      }
    });
  },
});
