import { mkdir, rename, rmdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { defaultLocale, locales } from "../i18n/locales.ts";

/**
 * Con build.format "directory", Astro solo saca /404 como 404.html: la de
 * /en/404 acabaría en en/404/index.html, una URL con 200. Esto la deja en
 * en/404.html, que Caddy sirve con estado 404 (deploy/Caddyfile). Si Astro
 * cambia y el fichero no está donde se espera, el build falla.
 */
export default function statusPages(): AstroIntegration {
  return {
    name: "status-pages",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        for (const locale of locales) {
          if (locale === defaultLocale) continue;
          const from = join(root, locale, "404", "index.html");
          const to = join(root, locale, "404.html");
          try {
            await mkdir(dirname(to), { recursive: true });
            await rename(from, to);
            await rmdir(dirname(from));
          } catch (e) {
            throw new Error(
              `No puedo mover dist/${locale}/404/index.html a dist/${locale}/404.html: ${(e as Error).message}`,
              { cause: e },
            );
          }
          logger.info(`dist/${locale}/404.html`);
        }
      },
    },
  };
}
