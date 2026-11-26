import { quoteResultFiles } from "../data/quote-form.ts";
import { defaultLocale, locales, type Locale } from "../i18n/locales.ts";

// Reglas de npm run check:seo (scripts/check-seo.mjs) sobre el HTML de dist/.
// Aquí, sin E/S, para poder probarlas. Lee el HTML con expresiones regulares:
// vale porque lo genera Astro (atributos entre comillas dobles, sin sorpresas).

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/**
 * Páginas sin URL propia (las 404 y las de resultado del formulario): sin
 * canonical, hreflang, JSON-LD ni sitemap.
 */
const noCanonical = (file: string) =>
  /(^|\/)404\.html$/.test(file) || quoteResultFiles.includes(file);

export interface HtmlFile {
  /** Ruta relativa a dist/, con "/": "index.html", "en/prices/index.html". */
  file: string;
  html: string;
}

interface Link {
  href: string;
  hreflang?: string | undefined;
}

interface ParsedPage {
  lang: string | undefined;
  h1: number;
  titles: string[];
  descriptions: string[];
  canonicals: string[];
  alternates: Link[];
  ogUrls: string[];
  ogImages: string[];
  /** Contenido de cada <script type="application/ld+json"> del <head>. */
  jsonLd: string[];
  links: Link[];
}

/** URL de un fichero de dist/: "precios/index.html" → "/precios/". */
export function urlPath(file: string): string {
  if (file === "index.html") return "/";
  return file.endsWith("/index.html")
    ? `/${file.slice(0, -"index.html".length)}`
    : `/${file}`;
}

/** Idioma de una ruta: "/en/…" es inglés; el resto, español (en la raíz). */
export function localeOf(path: string): Locale {
  return (
    locales.find((l) => l !== defaultLocale && path.startsWith(`/${l}/`)) ??
    defaultLocale
  );
}

/** Entidades HTML de texto y atributos (las que emite Astro y las numéricas). */
export function decode(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return text.replace(
    /&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi,
    (entity, code: string) => {
      if (code[0] === "#") {
        const n =
          code[1] === "x" || code[1] === "X"
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10);
        return String.fromCodePoint(n);
      }
      return named[code.toLowerCase()] ?? entity;
    },
  );
}

function attributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const [, name, value] of tag.matchAll(
    /\s([a-z][a-z0-9:-]*)(?:="([^"]*)")?/gi,
  )) {
    attrs.set(name!.toLowerCase(), decode(value ?? ""));
  }
  return attrs;
}

export function tags(html: string, name: string): Map<string, string>[] {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))].map(
    ([, attrs]) => attributes(` ${attrs}`),
  );
}

export function parsePage(html: string): ParsedPage {
  // Del <head> solamente: el logo SVG del cuerpo también lleva <title>.
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? "";
  const metas = tags(head, "meta");
  const links = tags(head, "link");
  const meta = (attr: "name" | "property", value: string) =>
    metas
      .filter((m) => m.get(attr) === value)
      .map((m) => m.get("content") ?? "");
  const rel = (value: string) =>
    links.filter((l) => l.get("rel")?.toLowerCase() === value);

  return {
    lang: tags(html, "html")[0]?.get("lang"),
    h1: tags(html, "h1").length,
    titles: [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(
      ([, text]) => decode(text!).trim(),
    ),
    descriptions: meta("name", "description"),
    canonicals: rel("canonical").map((l) => l.get("href") ?? ""),
    alternates: rel("alternate")
      .filter((l) => l.has("hreflang"))
      .map((l) => ({ href: l.get("href") ?? "", hreflang: l.get("hreflang") })),
    ogUrls: meta("property", "og:url"),
    ogImages: meta("property", "og:image"),
    jsonLd: [
      ...head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
    ].flatMap(([, attrs, body]) =>
      attributes(` ${attrs}`).get("type") === "application/ld+json"
        ? [body!]
        : [],
    ),
    links: tags(html, "a")
      .filter((a) => a.has("href"))
      .map((a) => ({ href: a.get("href")!, hreflang: a.get("hreflang") })),
  };
}

/** Ruta de un enlace interno a una página, o undefined si no lo es. */
function internalPagePath(href: string, site: string): string | undefined {
  let path: string;
  if (href.startsWith(`${site}/`)) path = href.slice(site.length);
  else if (href.startsWith("/") && !href.startsWith("//")) path = href;
  else return undefined;
  path = path.replace(/[?#].*$/, "");
  // Ficheros (favicon, imágenes, PDF): no son páginas de ningún idioma.
  const last = path.split("/").pop() ?? "";
  return last.includes(".") ? undefined : path;
}

const length = (text: string) => [...text].length;

/**
 * Errores SEO de las páginas de dist/. `files` son todas las rutas de dist/
 * (para comprobar que existe la imagen de og:image).
 */
export function checkSeo(
  pages: HtmlFile[],
  { site, files }: { site: string; files: ReadonlySet<string> },
): string[] {
  const errors: string[] = [];
  const parsed = new Map(
    pages.map(({ file, html }) => [file, parsePage(html)] as const),
  );
  const byUrl = new Map(
    pages.map(({ file }) => [`${site}${urlPath(file)}`, file] as const),
  );

  for (const [file, page] of parsed) {
    const err = (message: string) => errors.push(`dist/${file}: ${message}`);
    const path = urlPath(file);
    const url = `${site}${path}`;
    const locale = localeOf(path);

    if (page.lang !== locale) {
      err(`<html lang="${page.lang ?? ""}">, debería ser "${locale}".`);
    }
    if (page.h1 !== 1) err(`${page.h1} <h1>, debería haber 1.`);

    for (const [label, values, max] of [
      ["<title>", page.titles, TITLE_MAX],
      ['<meta name="description">', page.descriptions, DESCRIPTION_MAX],
    ] as const) {
      if (values.length !== 1) {
        err(`${values.length} ${label}, debería haber 1.`);
      } else if (!values[0]) {
        err(`${label} vacío.`);
      } else if (length(values[0]) > max) {
        err(
          `${label} de ${length(values[0])} caracteres (máximo ${max}): «${values[0]}».`,
        );
      }
    }

    if (page.ogImages.length !== 1) {
      err(`${page.ogImages.length} og:image, debería haber 1.`);
    } else {
      const image = page.ogImages[0]!;
      if (!image.startsWith(`${site}/`)) {
        err(`og:image "${image}" no es una URL absoluta de ${site}.`);
      } else if (!files.has(image.slice(site.length + 1))) {
        err(`og:image "${image}" no existe en dist/.`);
      }
    }

    for (const link of page.links) {
      const target = internalPagePath(link.href, site);
      if (target === undefined || link.hreflang) continue;
      if (localeOf(target) !== locale) {
        err(
          `enlace a ${link.href} (${localeOf(target)}) desde una página en ${locale}; solo el selector de idioma, con hreflang, cruza de idioma.`,
        );
      }
    }

    if (noCanonical(file)) {
      if (page.canonicals.length > 0 || page.alternates.length > 0) {
        err("sin URL propia: no lleva canonical ni hreflang.");
      }
      if (page.jsonLd.length > 0) err("sin URL propia: no lleva JSON-LD.");
      continue;
    }

    errors.push(
      ...checkJsonLd(page.jsonLd, { url, locale, site, files }).map(
        (message) => `dist/${file}: ${message}`,
      ),
    );

    if (page.canonicals.length !== 1) {
      err(`${page.canonicals.length} canonical, debería haber 1.`);
    } else if (page.canonicals[0] !== url) {
      err(`canonical "${page.canonicals[0]}", debería ser "${url}".`);
    }
    if (page.ogUrls.length !== 1 || page.ogUrls[0] !== url) {
      err(`og:url ${JSON.stringify(page.ogUrls)}, debería ser "${url}".`);
    }

    errors.push(
      ...checkAlternates(page.alternates, {
        url,
        locale,
        site,
        parsed,
        byUrl,
      }).map((message) => `dist/${file}: ${message}`),
    );
  }

  return errors;
}

function checkAlternates(
  alternates: Link[],
  {
    url,
    locale,
    site,
    parsed,
    byUrl,
  }: {
    url: string;
    locale: Locale;
    site: string;
    parsed: Map<string, ParsedPage>;
    byUrl: Map<string, string>;
  },
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const { hreflang } of alternates) {
    if (seen.has(hreflang!)) errors.push(`hreflang "${hreflang}" repetido.`);
    seen.add(hreflang!);
  }

  const self = alternates.find((a) => a.hreflang === locale);
  if (self?.href !== url) {
    errors.push(`falta hreflang="${locale}" a sí misma (${url}).`);
  }

  for (const { hreflang, href } of alternates) {
    if (hreflang === "x-default" || href === url) continue;
    const targetFile = byUrl.get(href);
    if (!targetFile) {
      errors.push(`hreflang="${hreflang}" a ${href}, que no está en dist/.`);
      continue;
    }
    const target = localeOf(href.slice(site.length));
    if (hreflang !== target) {
      errors.push(`hreflang="${hreflang}" a ${href}, que está en ${target}.`);
    }
    const back = parsed.get(targetFile)!.alternates;
    if (!back.some((a) => a.hreflang === locale && a.href === url)) {
      errors.push(
        `hreflang no recíproco: ${href} no enlaza de vuelta con hreflang="${locale}".`,
      );
    }
  }

  const fallback = alternates.find((a) => a.hreflang === defaultLocale);
  const xDefault = alternates.find((a) => a.hreflang === "x-default");
  if (fallback && xDefault?.href !== fallback.href) {
    errors.push(
      `x-default ${xDefault ? `a ${xDefault.href}` : "ausente"}, debería ir a la versión en ${defaultLocale} (${fallback.href}).`,
    );
  } else if (!fallback && xDefault) {
    errors.push(`x-default sin versión en ${defaultLocale}.`);
  }

  return errors;
}

type JsonNode = Record<string, unknown>;

/** Todos los objetos del JSON, a cualquier profundidad. */
function walk(value: unknown, visit: (node: JsonNode) => void): void {
  if (Array.isArray(value)) value.forEach((v) => walk(v, visit));
  else if (value && typeof value === "object") {
    visit(value as JsonNode);
    Object.values(value).forEach((v) => walk(v, visit));
  }
}

const typeOf = (node: JsonNode) => [node["@type"]].flat();

/**
 * Datos estructurados (src/lib/structured-data.ts): un solo bloque con @graph,
 * WebSite en el idioma de la página, Organization y LocalBusiness enlazados,
 * sin FAQPage, URLs absolutas del sitio y migas que acaban en la página.
 */
function checkJsonLd(
  blocks: string[],
  {
    url,
    locale,
    site,
    files,
  }: { url: string; locale: Locale; site: string; files: ReadonlySet<string> },
): string[] {
  if (blocks.length !== 1) {
    return [`${blocks.length} bloques JSON-LD, debería haber 1.`];
  }
  let data: unknown;
  try {
    data = JSON.parse(blocks[0]!);
  } catch (e) {
    return [`JSON-LD no válido: ${(e as Error).message}`];
  }
  const graph = (data as JsonNode | null)?.["@graph"];
  if (!Array.isArray(graph)) return ["JSON-LD sin @graph."];

  const errors: string[] = [];
  const nodes = graph as JsonNode[];
  const ofType = (type: string) =>
    nodes.filter((node) => typeOf(node).includes(type));

  const websites = ofType("WebSite");
  if (websites.length !== 1) {
    errors.push(`${websites.length} WebSite en el JSON-LD, debería haber 1.`);
  } else if (websites[0]!.inLanguage !== locale) {
    errors.push(
      `WebSite con inLanguage ${JSON.stringify(websites[0]!.inLanguage)}, debería ser "${locale}".`,
    );
  }

  const organizations = ofType("Organization");
  const businesses = ofType("LocalBusiness");
  if (organizations.length !== 1) {
    errors.push(
      `${organizations.length} Organization en el JSON-LD, debería haber 1.`,
    );
  }
  if (businesses.length !== 1) {
    errors.push(
      `${businesses.length} LocalBusiness en el JSON-LD, debería haber 1.`,
    );
  }
  const orgId = organizations[0]?.["@id"];
  const parent = (businesses[0]?.parentOrganization as JsonNode | undefined)?.[
    "@id"
  ];
  if (organizations.length === 1 && businesses.length === 1) {
    if (!orgId || parent !== orgId) {
      errors.push(
        `LocalBusiness.parentOrganization ${JSON.stringify(parent)} no apunta a la Organization (${JSON.stringify(orgId)}).`,
      );
    }
  }

  walk(graph, (node) => {
    if (typeOf(node).includes("FAQPage")) {
      errors.push("FAQPage en el JSON-LD: Google retiró ese resultado.");
    }
    for (const key of ["@id", "url", "item", "logo", "image"]) {
      const value = node[key];
      if (typeof value !== "string") continue;
      if (!value.startsWith(`${site}/`)) {
        errors.push(
          `JSON-LD: ${key} "${value}" no es una URL absoluta de ${site}.`,
        );
        continue;
      }
      const path = value.slice(site.length + 1).replace(/[?#].*$/, "");
      const last = path.split("/").pop() ?? "";
      if (last.includes(".") && !files.has(path)) {
        errors.push(`JSON-LD: ${key} "${value}" no existe en dist/.`);
      }
    }
  });

  for (const list of ofType("BreadcrumbList")) {
    const items = Array.isArray(list.itemListElement)
      ? (list.itemListElement as JsonNode[])
      : [];
    const last = items.at(-1)?.item;
    if (last !== url) {
      errors.push(
        `BreadcrumbList acaba en ${JSON.stringify(last)}, debería acabar en "${url}".`,
      );
    }
  }

  return errors;
}

/**
 * Errores de dist/sitemap.xml (src/lib/sitemap.ts). `pages` son los HTML de
 * dist/. Cada <loc> es una URL absoluta del sitio, sin repetir, de una página
 * que existe y no es una 404, con un lastmod YYYY-MM-DD válido. En producción,
 * además, están todas las páginas; fuera no se exige, porque los borradores
 * se generan pero no van al sitemap.
 */
export function checkSitemap(
  xml: string,
  {
    site,
    pages,
    production,
  }: { site: string; pages: readonly string[]; production: boolean },
): string[] {
  const errors: string[] = [];
  if (
    !/<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(
      xml,
    )
  ) {
    errors.push("sin <urlset> con el xmlns de sitemaps.org.");
  }

  const urls = new Set(
    pages
      .filter((file) => !noCanonical(file))
      .map((file) => `${site}${urlPath(file)}`),
  );
  const seen = new Set<string>();
  for (const [, body] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = decode(/<loc>([^<]*)<\/loc>/.exec(body!)?.[1]?.trim() ?? "");
    const lastmod = /<lastmod>([^<]*)<\/lastmod>/.exec(body!)?.[1]?.trim();
    if (!loc) {
      errors.push("<url> sin <loc>.");
      continue;
    }
    if (seen.has(loc)) errors.push(`${loc} repetida.`);
    seen.add(loc);
    if (!loc.startsWith(`${site}/`)) {
      errors.push(`${loc} no es una URL absoluta de ${site}.`);
    } else if (!urls.has(loc)) {
      errors.push(`${loc} no es una página de dist/ (o es una 404).`);
    }
    // "2026-02-30" pasa la regex pero Date lo corre al 2 de marzo.
    const date = new Date(lastmod ?? "");
    if (
      !lastmod ||
      !/^\d{4}-\d{2}-\d{2}$/.test(lastmod) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== lastmod
    ) {
      errors.push(
        `${loc}: lastmod ${JSON.stringify(lastmod ?? null)}, debería ser YYYY-MM-DD.`,
      );
    }
  }

  if (production) {
    for (const url of urls) {
      if (!seen.has(url)) errors.push(`falta ${url}.`);
    }
  }
  return errors;
}
