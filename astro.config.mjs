// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { TURNSTILE_TEST_SITE_KEY } from "./src/data/quote-form.ts";
import { defaultLocale, locales } from "./src/i18n/locales.ts";
import productionGuards from "./src/integrations/production-guards.ts";
import statusPages from "./src/integrations/status-pages.ts";
import { SITE } from "./src/lib/site.ts";
import { UMAMI_HOST, UMAMI_SCRIPT } from "./src/lib/umami.ts";

export default defineConfig({
  site: SITE,
  output: "static",
  // mdx: páginas con bloques (src/components/bloques/), como la home.
  // statusPages: la 404 en inglés como en/404.html, no en/404/index.html.
  // productionGuards: con SITE_ENV=production, ningún {{PENDIENTE en dist/
  // (README#guardas-de-producción).
  integrations: [mdx(), statusPages(), productionGuards()],
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
  env: {
    schema: {
      // Solo "production" genera páginas indexables. Sin valor, no indexable
      // (docs/despliegue.md#indexación).
      SITE_ENV: envField.enum({
        context: "server",
        access: "public",
        values: ["production", "provisional", "staging", "development"],
        default: "development",
      }),
      // Clave pública del widget de Turnstile del formulario (M3.2). Sin
      // valor, la de pruebas; el build de producción no la admite
      // (src/integrations/production-guards.ts).
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: "server",
        access: "public",
        default: TURNSTILE_TEST_SITE_KEY,
      }),
      // ID del sitio en Umami Cloud (M3.3). Sin valor, la web no carga
      // Umami; el build de producción no lo admite
      // (src/integrations/production-guards.ts).
      PUBLIC_UMAMI_WEBSITE_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
  security: {
    // CSP con los hashes de cada <script> y <style> inline, en un <meta> por
    // página. Caddy añade la cabecera con lo que un <meta> no puede llevar
    // (frame-ancestors) y el resto de cabeceras (deploy/Caddyfile).
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // Umami Cloud (M3.3) envía visitas y eventos a UMAMI_HOST.
        `connect-src 'self' ${UMAMI_HOST}`,
        // Turnstile (M3.2) pinta el desafío en un iframe.
        "frame-src https://challenges.cloudflare.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: {
        // Astro no calcula el hash de los <script is:inline>: el de la clase
        // .js de BaseLayout.astro (menú móvil, M1.4) va a mano. Si se toca ese
        // script, check:csp falla y dice qué hash falta.
        hashes: ["sha256-ZnYJX5ypMaaAhxxWhSEjbMkhO2A9yPmbzEQH3LFaITA="],
        resources: [
          "'self'",
          new URL(UMAMI_SCRIPT).origin,
          "https://challenges.cloudflare.com",
        ],
      },
      styleDirective: { resources: ["'self'"] },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    // En local, el formulario envía al endpoint de server/ (npm run dev:api).
    server: {
      proxy: { "/api/": "http://127.0.0.1:4311" },
    },
  },
});
