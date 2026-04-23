import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Sunshine",
    description: "Overlay beautiful shadow effects on any website",
    permissions: ["storage", "activeTab"],
    icons: {
      16: "icons/16.png",
      32: "icons/32.png",
      48: "icons/48.png",
      96: "icons/96.png",
      128: "icons/128.png",
    },
    action: {
      default_icon: {
        16: "icons/16.png",
        32: "icons/32.png",
      },
    },
    browser_specific_settings: {
      gecko: {
        id: "{d4f7e8a1-9c3b-4f2d-b6a8-1e5f7c9d2b4a}",
        strict_min_version: "109.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
    web_accessible_resources: [
      {
        resources: ["shadows/*"],
        matches: ["<all_urls>"],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
