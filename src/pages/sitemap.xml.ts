import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "../lib/site";
import { sitemapUrls, sitemapXml } from "../lib/sitemap";

// dist/sitemap.xml: todas las páginas de la colección salvo los borradores,
// con lastmod del campo updated. robots.txt lo enlaza.
export const GET: APIRoute = async () =>
  new Response(sitemapXml(sitemapUrls(await getCollection("pages"), SITE)), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
