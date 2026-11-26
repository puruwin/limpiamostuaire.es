import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkSeo,
  checkSitemap,
  localeOf,
  urlPath,
  type HtmlFile,
} from "./seo-check.ts";

const site = "https://example.com";
const files = new Set(["og.png"]);

interface Options {
  lang?: string;
  title?: string;
  description?: string;
  h1?: number;
  canonical?: string | null;
  alternates?: [string, string][];
  ogUrl?: string | null;
  ogImage?: string;
  links?: string[];
  /** Bloques JSON-LD tal cual; por defecto, uno correcto (jsonLd()). */
  jsonLd?: string[];
}

/** @graph mínimo como el de structured-data.ts. */
// Los tests cambian nodos a mano antes de serializarlos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function graph(path: string): Record<string, any>[] {
  const url = `${site}${path}`;
  return [
    {
      "@type": "WebSite",
      "@id": `${site}/#website`,
      url: `${site}/`,
      inLanguage: localeOf(path),
    },
    {
      "@type": "Organization",
      "@id": `${site}/#organization`,
      logo: { "@type": "ImageObject", url: `${site}/og.png` },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${site}/#tidi`,
      url,
      parentOrganization: { "@id": `${site}/#organization` },
    },
  ];
}

const jsonLd = (nodes: unknown[]) =>
  JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });

/** HTML mínimo como el de BaseLayout + Seo.astro. */
function html(path: string, o: Options = {}): string {
  const url = `${site}${path}`;
  const lang = o.lang ?? localeOf(path);
  const canonical = o.canonical === undefined ? url : o.canonical;
  const ogUrl = o.ogUrl === undefined ? url : o.ogUrl;
  const alternates = o.alternates ?? [
    [lang, url],
    ...(lang === "es" ? [["x-default", url] as [string, string]] : []),
  ];
  return `<!doctype html><html lang="${lang}"><head>
<title>${o.title ?? "Título"}</title>
<meta name="description" content="${o.description ?? "Descripción"}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
${alternates.map(([h, u]) => `<link rel="alternate" hreflang="${h}" href="${u}">`).join("\n")}
${ogUrl ? `<meta property="og:url" content="${ogUrl}">` : ""}
<meta property="og:image" content="${o.ogImage ?? `${site}/og.png`}">
${(o.jsonLd ?? [jsonLd(graph(path))]).map((j) => `<script type="application/ld+json">${j}</script>`).join("")}
</head><body><svg><title>Logo</title></svg>
${"<h1>H1</h1>".repeat(o.h1 ?? 1)}
${(o.links ?? []).map((href) => `<a href="${href}">x</a>`).join("")}
</body></html>`;
}

const check = (pages: HtmlFile[]) => checkSeo(pages, { site, files });

/** Pareja es/en de la misma página, con hreflang recíproco. */
function pair(esFile: string, enFile: string): HtmlFile[] {
  const es = `${site}${urlPath(esFile)}`;
  const en = `${site}${urlPath(enFile)}`;
  const alternates: [string, string][] = [
    ["es", es],
    ["en", en],
    ["x-default", es],
  ];
  return [
    { file: esFile, html: html(urlPath(esFile), { alternates }) },
    { file: enFile, html: html(urlPath(enFile), { alternates }) },
  ];
}

test("rutas e idioma a partir del fichero", () => {
  assert.equal(urlPath("index.html"), "/");
  assert.equal(urlPath("en/index.html"), "/en/");
  assert.equal(urlPath("precios/index.html"), "/precios/");
  assert.equal(urlPath("404.html"), "/404.html");
  assert.equal(localeOf("/"), "es");
  assert.equal(localeOf("/en/"), "en");
  assert.equal(localeOf("/en/prices/"), "en");
  assert.equal(localeOf("/entrada/"), "es");
});

test("una pareja es/en correcta no da errores", () => {
  assert.deepEqual(check(pair("index.html", "en/index.html")), []);
});

test("página solo en español: hreflang a sí misma y x-default", () => {
  assert.deepEqual(
    check([{ file: "benidorm/index.html", html: html("/benidorm/") }]),
    [],
  );
});

test("un solo <h1>", () => {
  const [error, ...rest] = check([
    { file: "index.html", html: html("/", { h1: 2 }) },
  ]);
  assert.match(error!, /2 <h1>/);
  assert.deepEqual(rest, []);
  assert.match(
    check([{ file: "index.html", html: html("/", { h1: 0 }) }])[0]!,
    /0 <h1>/,
  );
});

test("title ≤ 60 y description ≤ 155, contando caracteres y no entidades", () => {
  const ok = "Limpieza &amp; más ".repeat(3) + "ñ".repeat(15); // 45 + 15 = 60
  assert.deepEqual(
    check([{ file: "index.html", html: html("/", { title: ok }) }]),
    [],
  );
  assert.match(
    check([{ file: "index.html", html: html("/", { title: `${ok}x` }) }])[0]!,
    /<title> de 61 caracteres \(máximo 60\)/,
  );
  assert.match(
    check([
      { file: "index.html", html: html("/", { description: "a".repeat(156) }) },
    ])[0]!,
    /description"> de 156 caracteres \(máximo 155\)/,
  );
  assert.match(
    check([{ file: "index.html", html: html("/", { title: " " }) }])[0]!,
    /<title> vacío/,
  );
});

test("canonical propia y og:url igual", () => {
  assert.match(
    check([
      { file: "index.html", html: html("/", { canonical: `${site}/otra/` }) },
    ])[0]!,
    /canonical "https:\/\/example.com\/otra\/", debería ser "https:\/\/example.com\/"/,
  );
  assert.match(
    check([{ file: "index.html", html: html("/", { canonical: null }) }])[0]!,
    /0 canonical/,
  );
  assert.match(
    check([{ file: "index.html", html: html("/", { ogUrl: null }) }])[0]!,
    /og:url/,
  );
});

test("<html lang> según la ruta", () => {
  const errors = check([
    {
      file: "en/index.html",
      html: html("/en/", { lang: "es", alternates: [["en", `${site}/en/`]] }),
    },
  ]);
  assert.match(errors[0]!, /lang="es">, debería ser "en"/);
});

test("hreflang no recíproco", () => {
  const [es, en] = pair("index.html", "en/index.html");
  const enSolo = html("/en/", { alternates: [["en", `${site}/en/`]] });
  const errors = check([es!, { ...en!, html: enSolo }]);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /^dist\/index.html: hreflang no recíproco/);
});

test("hreflang a una página que no existe o con el idioma cambiado", () => {
  const alternates: [string, string][] = [
    ["es", `${site}/`],
    ["en", `${site}/en/`],
    ["x-default", `${site}/`],
  ];
  assert.match(
    check([{ file: "index.html", html: html("/", { alternates }) }])[0]!,
    /hreflang="en" a https:\/\/example.com\/en\/, que no está en dist/,
  );
  const swapped: [string, string][] = [
    ["es", `${site}/`],
    ["fr", `${site}/en/`],
    ["x-default", `${site}/`],
  ];
  const errors = check([
    { file: "index.html", html: html("/", { alternates: swapped }) },
    { file: "en/index.html", html: html("/en/", { alternates: swapped }) },
  ]);
  assert.ok(errors.some((e) => /hreflang="fr" .*que está en en/.test(e)));
  assert.ok(errors.some((e) => /falta hreflang="en" a sí misma/.test(e)));
});

test("x-default a la versión en español", () => {
  const alternates: [string, string][] = [["es", `${site}/`]];
  assert.match(
    check([{ file: "index.html", html: html("/", { alternates }) }])[0]!,
    /x-default ausente/,
  );
  const enOnly: [string, string][] = [
    ["en", `${site}/en/x/`],
    ["x-default", `${site}/en/x/`],
  ];
  assert.match(
    check([
      { file: "en/x/index.html", html: html("/en/x/", { alternates: enOnly }) },
    ])[0]!,
    /x-default sin versión en es/,
  );
});

test("enlaces internos solo a su idioma, salvo el selector", () => {
  const links = [
    "/precios/",
    `${site}/benidorm/#zonas`,
    "#contenido",
    "/favicon.svg",
    "https://wa.me/34600000000",
    "tel:+34600000000",
  ];
  assert.deepEqual(
    check([{ file: "index.html", html: html("/", { links }) }]),
    [],
  );
  const errors = check([
    { file: "index.html", html: html("/", { links: ["/en/prices/"] }) },
  ]);
  assert.match(
    errors[0]!,
    /enlace a \/en\/prices\/ \(en\) desde una página en es/,
  );
  const switcher = html("/", { links: [] }).replace(
    "</body>",
    '<a href="/en/" hreflang="en">EN</a></body>',
  );
  assert.deepEqual(check([{ file: "index.html", html: switcher }]), []);
});

test("og:image absoluta y existente", () => {
  assert.match(
    check([
      { file: "index.html", html: html("/", { ogImage: "/og.png" }) },
    ])[0]!,
    /no es una URL absoluta/,
  );
  assert.match(
    check([
      { file: "index.html", html: html("/", { ogImage: `${site}/no.png` }) },
    ])[0]!,
    /no existe en dist/,
  );
});

test("la 404 no lleva canonical, hreflang ni JSON-LD", () => {
  const page = html("/404.html", {
    canonical: null,
    ogUrl: null,
    alternates: [],
    jsonLd: [],
  });
  assert.deepEqual(check([{ file: "404.html", html: page }]), []);
  assert.match(
    check([{ file: "404.html", html: html("/404.html", { jsonLd: [] }) }])[0]!,
    /sin URL propia: no lleva canonical ni hreflang/,
  );
  assert.match(
    check([
      {
        file: "404.html",
        html: html("/404.html", {
          canonical: null,
          ogUrl: null,
          alternates: [],
        }),
      },
    ])[0]!,
    /sin URL propia: no lleva JSON-LD/,
  );
});

/** Errores de la home con estos bloques JSON-LD. */
const ld = (...blocks: string[]) =>
  check([{ file: "index.html", html: html("/", { jsonLd: blocks }) }]);

test("JSON-LD: un solo bloque, válido y con @graph", () => {
  assert.match(ld()[0]!, /0 bloques JSON-LD/);
  const ok = jsonLd(graph("/"));
  assert.match(ld(ok, ok)[0]!, /2 bloques JSON-LD/);
  assert.match(ld("{rota")[0]!, /JSON-LD no válido/);
  assert.match(ld("{}")[0]!, /sin @graph/);
});

test("JSON-LD: WebSite en el idioma de la página", () => {
  const nodes = graph("/");
  nodes[0]!.inLanguage = "en";
  assert.match(ld(jsonLd(nodes))[0]!, /inLanguage "en", debería ser "es"/);
  assert.match(ld(jsonLd(nodes.slice(1)))[0]!, /0 WebSite/);
});

test("JSON-LD: LocalBusiness hijo de la Organization", () => {
  const nodes = graph("/");
  nodes[2]!.parentOrganization = { "@id": `${site}/#otra` };
  assert.match(ld(jsonLd(nodes))[0]!, /parentOrganization .* no apunta/);
  assert.match(ld(jsonLd(nodes.slice(0, 2)))[0]!, /0 LocalBusiness/);
});

test("JSON-LD: sin FAQPage", () => {
  const nodes = [...graph("/"), { "@type": "FAQPage" }];
  assert.match(ld(jsonLd(nodes))[0]!, /FAQPage/);
});

test("JSON-LD: URLs absolutas y ficheros existentes", () => {
  const nodes = graph("/");
  nodes[1]!.logo.url = "/og.png";
  assert.match(ld(jsonLd(nodes))[0]!, /url "\/og.png" no es una URL absoluta/);
  nodes[1]!.logo.url = `${site}/logo.png`;
  assert.match(ld(jsonLd(nodes))[0]!, /logo.png" no existe en dist/);
});

test("JSON-LD: las migas acaban en la página", () => {
  const crumbs = (last: string) => ({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, item: `${site}/` },
      { "@type": "ListItem", position: 2, item: last },
    ],
  });
  const page = (last: string) => ({
    file: "precios/index.html",
    html: html("/precios/", {
      jsonLd: [jsonLd([...graph("/precios/"), crumbs(last)])],
    }),
  });
  assert.deepEqual(check([page(`${site}/precios/`)]), []);
  assert.match(
    check([page(`${site}/otra/`)])[0]!,
    /BreadcrumbList acaba en "https:\/\/example.com\/otra\/"/,
  );
});

const sitemap = (...urls: [string, string?][]) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc, lastmod = "2026-11-25"]) => `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}
</urlset>`;
const distPages = ["index.html", "en/index.html", "404.html", "en/404.html"];
const sm = (xml: string, production = false) =>
  checkSitemap(xml, { site, pages: distPages, production });

test("sitemap: páginas de dist/, sin 404 ni repetidas", () => {
  assert.deepEqual(sm(sitemap([`${site}/`], [`${site}/en/`]), true), []);
  assert.match(sm(sitemap([`${site}/404.html`]))[0]!, /o es una 404/);
  assert.match(sm(sitemap([`${site}/precios/`]))[0]!, /no es una página/);
  assert.match(sm(sitemap(["https://otro.es/"]))[0]!, /no es una URL absoluta/);
  assert.match(sm(sitemap([`${site}/`], [`${site}/`]))[0]!, /repetida/);
  assert.match(sm("<urlset></urlset>")[0]!, /xmlns/);
});

test("sitemap: lastmod YYYY-MM-DD válido", () => {
  assert.match(sm(sitemap([`${site}/`, "2026-13-01"]))[0]!, /lastmod/);
  assert.match(sm(sitemap([`${site}/`, "2026-02-30"]))[0]!, /lastmod/);
  assert.match(sm(sitemap([`${site}/`, "2026-11-25T10:00"]))[0]!, /lastmod/);
});

test("sitemap: en producción están todas las páginas", () => {
  assert.deepEqual(sm(sitemap([`${site}/`])), []);
  assert.deepEqual(sm(sitemap([`${site}/`]), true), [`falta ${site}/en/.`]);
});
