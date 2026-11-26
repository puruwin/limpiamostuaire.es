import assert from "node:assert/strict";
import { test } from "node:test";
import { sitemapUrls, sitemapXml, type SitemapEntry } from "./sitemap.ts";

const site = "https://example.com";

function page(
  id: string,
  data: Partial<SitemapEntry["data"]> = {},
): SitemapEntry {
  return {
    id,
    data: {
      locale: id.startsWith("en/") ? "en" : "es",
      translationKey: id,
      slug: id.split("/")[1] ?? "",
      title: id,
      draft: false,
      updated: new Date("2026-11-25"),
      ...data,
    },
  };
}

test("una URL absoluta con barra final por página, ordenadas", () => {
  const urls = sitemapUrls(
    [
      page("en/prices", { slug: "prices" }),
      page("es/inicio", { slug: "" }),
      page("es/zonas", { slug: "zonas/benidorm" }),
      page("en/home", { slug: "" }),
    ],
    site,
  );
  assert.deepEqual(
    urls.map((u) => u.loc),
    [
      "https://example.com/",
      "https://example.com/en/",
      "https://example.com/en/prices/",
      "https://example.com/zonas/benidorm/",
    ],
  );
});

test("lastmod sale de updated, no de la fecha del build", () => {
  const [url] = sitemapUrls(
    [page("es/precios", { updated: new Date("2025-03-07") })],
    site,
  );
  assert.equal(url!.lastmod, "2025-03-07");
});

test("los borradores no van al sitemap", () => {
  const urls = sitemapUrls(
    [page("es/precios"), page("es/negocios", { draft: true })],
    site,
  );
  assert.deepEqual(
    urls.map((u) => u.loc),
    ["https://example.com/precios/"],
  );
});

test("XML del urlset, escapado", () => {
  const xml = sitemapXml([
    { loc: "https://example.com/?a=1&b=<2>", lastmod: "2026-11-25" },
  ]);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset /);
  assert.match(
    xml,
    /<loc>https:\/\/example.com\/\?a=1&amp;b=&lt;2&gt;<\/loc>\n {4}<lastmod>2026-11-25<\/lastmod>/,
  );
  assert.equal(sitemapXml([]).includes("<url>"), false);
});
