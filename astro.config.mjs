// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { defaultLocale, locales } from "./src/i18n/locales.ts";

export default defineConfig({
  site: "https://limpiamostuaire.es",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    // CSS dentro del HTML: una hoja externa bloquea el primer pintado.
    inlineStylesheets: "always",
  },
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: { prefixDefaultLocale: false },
  },
  // Figtree variable (DESIGN.md), autoalojada desde Fontsource: ni el build ni
  // la web piden nada a Google Fonts. Basta el subconjunto latino (ñ, á, ü…).
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Figtree",
      cssVariable: "--font-figtree",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            weight: "300 900",
            style: "normal",
            src: [
              "./node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2",
            ],
          },
        ],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
