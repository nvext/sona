import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const infrastructureScanDir = fileURLToPath(new URL("./server/infrastructure", import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],

  app: {
    baseURL: "/sona/",
  },

  // vite: { plugins: [tailwindcss()] },
  nitro: {
    preset: "node-server",
    scanDirs: [infrastructureScanDir],
  },
  modules: ["@nuxt/image", "@nuxt/ui"],
  ui: {
    colorMode: false,
    fonts: false,
  },
});
