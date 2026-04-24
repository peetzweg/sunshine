import { describe, expect, it } from "vitest";
import {
  DEFAULT_GLOBAL_SETTINGS,
  normalizeHostname,
  resolveOverlayConfig,
  seedOverrideFromGlobal,
  siteStorageKey,
  type GlobalSettings,
  type SiteOverride,
} from "./constants";

describe("normalizeHostname", () => {
  it("strips a leading www.", () => {
    expect(normalizeHostname("www.example.com")).toBe("example.com");
  });

  it("treats www.example.com and example.com as the same key", () => {
    expect(normalizeHostname("www.example.com")).toBe(
      normalizeHostname("example.com"),
    );
  });

  it("keeps non-www subdomains separate from the bare domain", () => {
    // This is the whole point of the override model — an app on a subdomain
    // must not inherit settings from the marketing site.
    expect(normalizeHostname("app.example.com")).toBe("app.example.com");
    expect(normalizeHostname("app.example.com")).not.toBe(
      normalizeHostname("example.com"),
    );
    expect(normalizeHostname("app.example.com")).not.toBe(
      normalizeHostname("www.example.com"),
    );
  });

  it("leaves deep subdomains intact", () => {
    expect(normalizeHostname("a.b.example.com")).toBe("a.b.example.com");
  });

  it("only strips one leading www. (www.www.x.com -> www.x.com)", () => {
    // Degenerate input; documenting the behavior so we notice if the regex
    // changes to global stripping.
    expect(normalizeHostname("www.www.example.com")).toBe("www.example.com");
  });

  it("does not strip www in the middle of the hostname", () => {
    expect(normalizeHostname("foo.www.example.com")).toBe(
      "foo.www.example.com",
    );
  });

  it("leaves localhost unchanged", () => {
    expect(normalizeHostname("localhost")).toBe("localhost");
  });

  it("leaves IPv4 addresses unchanged", () => {
    expect(normalizeHostname("192.168.1.10")).toBe("192.168.1.10");
  });

  it("does not choke on an empty string", () => {
    // Content script already early-returns on empty hostname, but the helper
    // should be total.
    expect(normalizeHostname("")).toBe("");
  });
});

describe("siteStorageKey", () => {
  it("prefixes with sunshine:site: so it can't collide with legacy keys", () => {
    // Legacy pre-refactor keys used sunshine:{hostname} (no "site:" segment)
    // and sunshine:domain:{eTLD+1}. The new prefix must stay distinct.
    expect(siteStorageKey("example.com")).toBe("sunshine:site:example.com");
    expect(siteStorageKey("example.com")).not.toMatch(/^sunshine:domain:/);
    expect(siteStorageKey("example.com")).not.toBe("sunshine:example.com");
  });

  it("is stable for the same input", () => {
    expect(siteStorageKey("example.com")).toBe(siteStorageKey("example.com"));
  });

  it("produces different keys for different hostnames", () => {
    expect(siteStorageKey("example.com")).not.toBe(
      siteStorageKey("app.example.com"),
    );
  });
});

describe("resolveOverlayConfig", () => {
  const globalActive: GlobalSettings = {
    active: true,
    shadow: "041",
    opacity: 0.4,
  };
  const globalInactive: GlobalSettings = {
    active: false,
    shadow: "041",
    opacity: 0.4,
  };

  it("returns global when no override exists", () => {
    expect(resolveOverlayConfig(globalActive, undefined)).toEqual(globalActive);
  });

  it("returns the override when one exists (active override wins)", () => {
    const override: SiteOverride = {
      active: true,
      shadow: "007",
      opacity: 0.2,
    };
    expect(resolveOverlayConfig(globalActive, override)).toEqual(override);
  });

  it("lets an override force the overlay OFF on a single site while global is ON", () => {
    // This is the "disable just this one site" path — active:false on the
    // override must beat active:true on global. Without this guarantee the
    // user has no way to opt a single site out without turning global off.
    const forceOff: SiteOverride = {
      active: false,
      shadow: "041",
      opacity: 0.4,
    };
    expect(resolveOverlayConfig(globalActive, forceOff).active).toBe(false);
  });

  it("lets an override force the overlay ON for a single site while global is OFF", () => {
    // The inverse — user hasn't enabled global, but wants the overlay on one
    // specific site.
    const forceOn: SiteOverride = {
      active: true,
      shadow: "063",
      opacity: 0.5,
    };
    expect(resolveOverlayConfig(globalInactive, forceOn).active).toBe(true);
  });

  it("does not mutate either input", () => {
    const override: SiteOverride = {
      active: true,
      shadow: "007",
      opacity: 0.2,
    };
    const globalCopy = { ...globalActive };
    const overrideCopy = { ...override };
    resolveOverlayConfig(globalActive, override);
    expect(globalActive).toEqual(globalCopy);
    expect(override).toEqual(overrideCopy);
  });
});

describe("seedOverrideFromGlobal", () => {
  it("copies shadow and opacity from the current global", () => {
    const global: GlobalSettings = {
      active: true,
      shadow: "041",
      opacity: 0.4,
    };
    const seeded = seedOverrideFromGlobal(global);
    expect(seeded.shadow).toBe("041");
    expect(seeded.opacity).toBe(0.4);
  });

  it("forces active:true even when global is inactive", () => {
    // Flipping "Customize for this site" should always produce a visible
    // effect. If the seed inherited global.active:false, the toggle would
    // appear broken on a user who hasn't enabled global yet.
    const global: GlobalSettings = {
      ...DEFAULT_GLOBAL_SETTINGS,
      active: false,
    };
    expect(seedOverrideFromGlobal(global).active).toBe(true);
  });

  it("preserves active:true when global is already active", () => {
    const global: GlobalSettings = {
      active: true,
      shadow: "063",
      opacity: 0.6,
    };
    expect(seedOverrideFromGlobal(global).active).toBe(true);
  });

  it("returns a fresh object each call (no shared reference)", () => {
    const global: GlobalSettings = { ...DEFAULT_GLOBAL_SETTINGS };
    const a = seedOverrideFromGlobal(global);
    const b = seedOverrideFromGlobal(global);
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
