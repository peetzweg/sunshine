<p align="center">
  <img src="./sunshine.svg" alt="Sunshine" width="96" height="96">
</p>

# Sunshine

A browser extension that overlays beautiful shadow effects on any website. Built with [WXT](https://wxt.dev/), React, and Tailwind CSS.

## Features

- **Global toggle** — enable the shadow overlay on all websites at once
- **Per-domain toggle** — enable it only on specific domains
- **Shadow presets** — choose from four shadow styles: Whisper, Gentle, Dappled, and Deep
- **Opacity control** — adjust overlay intensity from 5% to 80%
- **Per-site settings** — shadow style and opacity are saved per hostname
- **Zero flicker** — content script injects at `document_start` so the overlay appears before the first paint

## Getting started

```bash
pnpm install
pnpm dev          # Chrome
pnpm dev:firefox  # Firefox
```

## Building

```bash
pnpm build          # Chrome
pnpm build:firefox  # Firefox
pnpm zip            # Package for Chrome Web Store
pnpm zip:firefox    # Package for Firefox Add-ons
```

## Tech stack

- [WXT](https://wxt.dev/) — next-gen browser extension framework
- [React 19](https://react.dev/) — popup UI
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- TypeScript
