import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";
import { TURNSTILE_TEST_SITE_KEY } from "../data/quote-form.ts";
import { findPendientes, PENDIENTE } from "../lib/pendientes.ts";

// Claves de pruebas de Cloudflare: un dígito, "x" y ceros.
const TURNSTILE_TEST_KEY = /^\dx0{20}/;

/** SITE_ENV y la clave de Turnstile, del mismo origen que astro:env. */
function buildEnv() {
  const env = loadEnv("production", process.cwd(), "");
  const pick = (name: string) => process.env[name] || env[name];
  return {
    siteEnv: pick("SITE_ENV") || "development",
    turnstileSiteKey: pick("PUBLIC_TURNSTILE_SITE_KEY")?.trim() || "",
  };
}

/**
 * Con SITE_ENV=production el build falla si el formulario usaría la clave de
 * pruebas de Turnstile (M3.2) o si queda un {{PENDIENTE en cualquier fichero
 * de dist/. Los borradores los para la ruta dinámica (src/lib/pages.ts). En
 * staging, provisional y local no bloquea nada.
 */
export default function productionGuards(): AstroIntegration {
  return {
    name: "production-guards",
    hooks: {
      "astro:build:start": () => {
        const { siteEnv, turnstileSiteKey } = buildEnv();
        if (siteEnv !== "production") return;
        const key = turnstileSiteKey || TURNSTILE_TEST_SITE_KEY;
        if (TURNSTILE_TEST_KEY.test(key)) {
          throw new Error(
            "SITE_ENV=production: falta PUBLIC_TURNSTILE_SITE_KEY (el formulario usaría la clave de pruebas de Turnstile).",
          );
        }
      },
      "astro:build:done": async ({ dir, logger }) => {
        if (buildEnv().siteEnv !== "production") return;

        const found = await findPendientes(fileURLToPath(dir));
        if (found.length > 0) {
          throw new Error(
            `SITE_ENV=production: ${found.length} ${PENDIENTE} en dist/:\n` +
              found.map((f) => `  dist/${f}`).join("\n"),
          );
        }
        logger.info(`Sin ${PENDIENTE} en dist/.`);
      },
    },
  };
}
