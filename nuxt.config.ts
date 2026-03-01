import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const infrastructureScanDir = fileURLToPath(new URL("./server/infrastructure", import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  icon: {
    clientBundle: {
      scan: true,
      icons: [
        "lucide:log-in",
        "lucide:log-out",
        "lucide:menu",
        "lucide:minus",
        "lucide:plus",
        "lucide:shield",
        "lucide:shield-check",
        "lucide:user-plus",
        "lucide:x",
      ],
    },
  },

  // vite: { plugins: [tailwindcss()] },
  nitro: {
    preset: "node-server",
    scanDirs: [infrastructureScanDir],
  },
  modules: ["@nuxt/image", "@nuxt/ui"],
  runtimeConfig: {
    public: {
      adminUiEnabled: process.env.ADMIN_UI_ENABLED !== "false",
      adminWriteCsrfToken: process.env.ADMIN_WRITE_CSRF_TOKEN ?? "",
    },
  },
  ui: {
    colorMode: false,
    fonts: false,
  },
});
