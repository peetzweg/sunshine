# Sunshine — Firefox AMO Go-Live

Checklist for publishing Sunshine to [addons.mozilla.org](https://addons.mozilla.org) (AMO).

The extension is already Firefox-ready — `wxt.config.ts` sets a gecko ID and `strict_min_version: 109.0`, all code uses the `browser.*` WebExtensions API, and the release workflow already ships Firefox artifacts. What follows is the submission runbook.

Listing copy (name, descriptions, permission justifications, tags) lives in [`STORE_LISTING.md`](./STORE_LISTING.md) and is shared with the Chrome Web Store listing — copy from there into AMO's form.

## 1. Prerequisites

- Firefox account at accounts.firefox.com with 2FA enabled (AMO requires 2FA for submissions)
- AMO developer agreement accepted: https://addons.mozilla.org/developers/
- Repo must have a `LICENSE` file before submitting — AMO requires specifying a license for the source bundle. MPL-2.0 is a Mozilla-friendly default; MIT is fine too.

## 2. Pre-flight checks

```sh
pnpm install
pnpm dev:firefox        # sideloads into a clean Firefox profile
```

In the spawned Firefox window, smoke-test the golden path:

- Popup opens from the toolbar
- All four presets (Whisper, Gentle, Dappled, Deep) apply and are visible
- Opacity slider works across its full 5–80% range
- Global toggle on/off works
- Per-domain toggle works and persists across reloads
- Settings survive a browser restart

Then confirm the production build is clean:

```sh
pnpm build:firefox
```

Peek at `.output/firefox-mv2/manifest.json` and verify:

- `browser_specific_settings.gecko.id` is present
- `browser_specific_settings.gecko.data_collection_permissions` is present (AMO now rejects uploads without it — see https://mzl.la/firefox-builtin-data-consent). Sunshine uses `{"required": ["none"]}` because it collects no user data.
- No `chrome`-specific fields snuck in
- `manifest_version` is `2` (WXT's default for Firefox — AMO accepts both MV2 and MV3)

## 3. Build submission artifacts

```sh
pnpm zip:firefox
```

This produces two files under `.output/`:

- `sunshine-extension-<VERSION>-firefox.zip` — the extension upload
- `sunshine-extension-<VERSION>-sources.zip` — the source archive (AMO requires this for any addon built with a bundler; WXT uses Vite/Rollup, so it applies)

Alternative: both zips are attached to every GitHub Release by `.github/workflows/release.yml`. Download them from the Releases page instead of building locally if you prefer.

## 4. Create the AMO listing

Head to https://addons.mozilla.org/developers/addon/submit/ and pick **"On this site"** (listed).

### Upload

- Upload `sunshine-extension-<VERSION>-firefox.zip`
- When prompted for sources, upload `sunshine-extension-<VERSION>-sources.zip`

### Build instructions (paste into AMO's "How to build" box)

```
Requires Node.js 20+ and pnpm 10+.

1. pnpm install
2. pnpm zip:firefox

Output: .output/sunshine-extension-<VERSION>-firefox.zip
Built on: macOS / Ubuntu, Node 20, pnpm 10.28.2, WXT 0.19.x
```

### Listing fields

Pull from [`STORE_LISTING.md`](./STORE_LISTING.md):

| Field | Value |
|---|---|
| Name | Sunshine |
| Summary | Short description from `STORE_LISTING.md` (≤250 chars for AMO) |
| Description | Long description from `STORE_LISTING.md` |
| Category | **Appearance** (primary) |
| Tags | shadow, overlay, ambient, aesthetic, appearance |
| Homepage URL | GitHub Pages landing page (`docs/index.html`) |
| Support site | GitHub repo issues page |
| Support email | your contact address |
| Privacy policy URL | GitHub Pages `docs/privacy.html` |
| License | MPL-2.0 (or whatever `LICENSE` specifies) |

### Permission justifications

If the AMO reviewer asks (or you want to fill them in proactively), reuse the three blocks already in `STORE_LISTING.md`:

- `storage`
- `activeTab`
- Content script on all URLs (`<all_urls>`)

The existing copy is already store-agnostic.

## 5. Screenshots

AMO requires at least one screenshot; up to ten allowed. PNG or JPEG.

- Hero: reuse `demo.png` from the repo root
- Optional: a popup-only capture showing the four presets + opacity slider

Mozilla recommends 2560×1600 or similar 16:10 ratio, but smaller works.

## 6. Submit and review

- After upload, the automated validator runs in ~minutes. Fix any blocking errors and re-upload.
- Listed addons publish once the automated scan passes; human review follows and can take days to weeks.
- Reviewers often ping on `<all_urls>` content scripts — the justification in `STORE_LISTING.md` is already the answer. Respond via the AMO developer dashboard, not email reply.
- Expect two `Unsafe assignment to innerHTML` warnings pointing at `chunks/popup-*.js` — those come from React's compiled runtime (`react-dom`), not user code. They are warnings, not errors, and do not block publication.

## 7. Post-publish

- Add the AMO listing URL to `README.md` and `docs/index.html` (mirror commit `d12f62d`, which added the Chrome Web Store link).
- If you bump the version for the AMO submission, open a changeset (`pnpm changeset`) so the release workflow tags and re-uploads the artifacts.
- Future updates: bump version → merge → workflow attaches new zips to the Release → upload the new `-firefox.zip` + `-sources.zip` to the same AMO listing under "New Version".
