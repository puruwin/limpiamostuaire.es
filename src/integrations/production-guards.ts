import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";
import { findPendientes, PENDIENTE } from "../lib/pendientes.ts";

/**
 * Con SITE_ENV=production el build falla si queda un {{PENDIENTE en
 * cualquier fichero de dist/. Los borradores los para la ruta dinámica
 * (src/lib/pages.ts). En staging, provisional y local no bloquea nada.
 */
export default function productionGuards(): AstroIntegration {
  return {
    name: "production-guards",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        // Mismo origen que astro:env: process.env y los .env.
        const env = loadEnv("production", process.cwd(), "");
        const siteEnv = process.env.SITE_ENV || env.SITE_ENV || "development";
        if (siteEnv !== "production") return;

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
