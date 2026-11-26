import { pagePath, type PageEntry } from "./pages.ts";

// sitemap.xml (src/pages/sitemap.xml.ts). Aquí, sin astro:content, para poder
// probarlo. check:seo lo vuelve a comprobar en dist/ (checkSitemap).

/** Lo que hace falta de una entrada de `pages` para el sitemap. */
export type SitemapEntry = PageEntry & { data: { updated: Date } };

export interface SitemapUrl {
  /** URL absoluta, con barra final. */
  loc: string;
  /** Fecha del campo `updated` del contenido (YYYY-MM-DD), no la del build. */
  lastmod: string;
}

/** URLs del sitemap: todas las páginas salvo los borradores, ordenadas. */
export function sitemapUrls(
  entries: SitemapEntry[],
  site: string,
): SitemapUrl[] {
  return entries
    .filter((entry) => !entry.data.draft)
    .map((entry) => ({
      loc: new URL(pagePath(entry.data.locale, entry.data.slug), site).href,
      // z.coerce.date deja "2026-11-25" a las 00:00 UTC: el día no se mueve.
      lastmod: entry.data.updated.toISOString().slice(0, 10),
    }))
    .sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));
}

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * <urlset> con <loc> y <lastmod>. Sin changefreq ni priority (Google los
 * ignora) ni hreflang (ya va en el HTML y lo valida check:seo).
 */
export function sitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      ({ loc, lastmod }) =>
        `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}</urlset>\n`;
}
