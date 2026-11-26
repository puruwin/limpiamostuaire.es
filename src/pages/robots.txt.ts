import type { APIRoute } from "astro";
import { SITE } from "../lib/site";

// Igual en todos los entornos y sin Disallow: fuera de producción lo que
// impide indexar es el noindex (docs/despliegue.md#indexación). Si Google no
// pudiera rastrear, no vería el noindex. check:robots lo comprueba.
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
