# Sunshine — Store Listing

## Short Description (132 chars max)

Overlay beautiful shadow effects on any website. Choose from 4 styles, adjust opacity, and save preferences per site.

## Long Description

Sunshine adds beautiful, natural shadow overlays to any website you visit — like dappled sunlight through leaves, gentle window shadows, or soft ambient light.

**Features:**

- 4 handcrafted shadow presets: Whisper, Gentle, Dappled, and Deep
- Adjustable opacity from 5% to 80%
- Enable globally or per-domain — your choice
- Per-site settings automatically saved
- Zero-flicker: overlay appears before the page paints
- Lightweight and fast — no impact on page performance
- No data collection, no tracking, fully offline

**How it works:**

Click the Sunshine icon in your toolbar to open the controls. Toggle the overlay on globally or just for the current domain. Pick a shadow style, adjust the opacity, and Sunshine remembers your preferences for next time.

## Category

- Chrome Web Store: Accessibility (or Productivity > Tools)
- Firefox Add-ons: Appearance

## Permission Justifications (Chrome Web Store submission form)

**storage:**
Used to save the user's per-site shadow preferences (selected style and opacity) locally on their device. No data is transmitted externally.

**activeTab:**
Used to communicate between the popup UI and the content script running on the active tab when the user opens Sunshine's controls. This allows the popup to display the current page's settings and apply changes in real time.

**Content script on all URLs:**
Sunshine's core functionality is overlaying shadow effects on websites. The content script must run on all pages so users can apply shadows to any site they visit. No page content is read, collected, or modified — the script only adds a visual overlay element.

## Tags

shadow, overlay, ambient, aesthetic, visual, appearance, accessibility
