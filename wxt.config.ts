import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Sunshine",
    description: "Overlay beautiful shadow effects on any website",
    permissions: ["storage", "activeTab"],
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
