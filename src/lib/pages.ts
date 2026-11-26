import {
  defaultLocale,
  locales,
  localePrefix,
  type Locale,
} from "../i18n/locales.ts";

/** Lo mínimo de una entrada de la colección `pages` que hace falta para validar. */
export interface PageEntry {
  id: string;
  filePath?: string;
  data: {
    locale: Locale;
    translationKey: string;
    slug: string;
    title: string;
    draft: boolean;
  };
}

/** URL de la página, con barra final: "/", "/en/", "/precios/", "/en/prices/". */
export function pagePath(locale: Locale, slug: string): string {
  const path = `${localePrefix(locale)}/${slug}`;
  return path.endsWith("/") ? path : `${path}/`;
}

/** `params.path` de la ruta [...path]: sin barras; undefined para la home en español. */
export function routeParam(locale: Locale, slug: string): string | undefined {
  return pagePath(locale, slug).replace(/^\/|\/$/g, "") || undefined;
}

/**
 * Errores de la colección: rutas o translationKey repetidos, locale que no
 * coincide con la carpeta y, en producción, borradores.
 */
export function validatePages(
  entries: PageEntry[],
  { production }: { production: boolean },
): string[] {
  const errors: string[] = [];
  const byPath = new Map<string, string>();
  const byKey = new Map<string, string>();

  for (const entry of entries) {
    const { locale, translationKey, slug, draft } = entry.data;
    const name = entry.filePath ?? entry.id;

    const folder = entry.id.split("/")[0];
    if (folder !== locale) {
      errors.push(
        `${name}: locale "${locale}" pero está en la carpeta "${folder}/".`,
      );
    }

    const path = pagePath(locale, slug);
    const samePath = byPath.get(path);
    if (samePath)
      errors.push(`${name}: la ruta ${path} ya la usa ${samePath}.`);
    else byPath.set(path, name);

    const key = `${locale}:${translationKey}`;
    const sameKey = byKey.get(key);
    if (sameKey) {
      errors.push(
        `${name}: translationKey "${translationKey}" en ${locale} ya la usa ${sameKey}.`,
      );
    } else byKey.set(key, name);

    if (production && draft) {
      errors.push(`${name}: draft: true en un build de producción.`);
    }
  }

  return errors;
}

/** URL de la página `translationKey` en `locale`, o undefined si no existe. */
export function pageUrlByKey(
  entries: PageEntry[],
  locale: Locale,
  translationKey: string,
): string | undefined {
  const entry = entries.find(
    (e) => e.data.locale === locale && e.data.translationKey === translationKey,
  );
  return entry ? pagePath(locale, entry.data.slug) : undefined;
}

/**
 * Enlaces del selector de idioma: la página equivalente en cada idioma o, si
 * no existe en ese idioma, su home.
 */
export function languageLinks(
  entries: PageEntry[],
  current: Locale,
  translationKey?: string,
): { locale: Locale; url: string; current: boolean }[] {
  return locales.map((locale) => ({
    locale,
    url:
      (translationKey && pageUrlByKey(entries, locale, translationKey)) ||
      pagePath(locale, ""),
    current: locale === current,
  }));
}

/**
 * Enlaces hreflang de la página `translationKey`: una entrada por cada idioma
 * en el que existe (la propia incluida) y `x-default` a la española. Al
 * contrario que languageLinks, no cae a la home: solo equivalentes reales.
 */
export function alternateLinks(
  entries: PageEntry[],
  translationKey: string,
): { hreflang: Locale | "x-default"; url: string }[] {
  const links: { hreflang: Locale | "x-default"; url: string }[] = [];
  for (const locale of locales) {
    const url = pageUrlByKey(entries, locale, translationKey);
    if (url) links.push({ hreflang: locale, url });
  }
  const fallback = links.find((link) => link.hreflang === defaultLocale);
  if (fallback) links.push({ hreflang: "x-default", url: fallback.url });
  return links;
}

/**
 * Migas de pan de la página `translationKey`: la home y cada página que exista
 * en los prefijos de su slug ("zonas", "zonas/benidorm"), la propia incluida,
 * con su `title` como nombre. Vacío en la home o si la página no existe.
 */
export function breadcrumbTrail(
  entries: PageEntry[],
  locale: Locale,
  translationKey: string,
  homeName: string,
): { name: string; url: string }[] {
  const page = entries.find(
    (e) => e.data.locale === locale && e.data.translationKey === translationKey,
  );
  if (!page || page.data.slug === "") return [];
  const segments = page.data.slug.split("/");
  const trail = [{ name: homeName, url: pagePath(locale, "") }];
  for (let i = 1; i <= segments.length; i++) {
    const slug = segments.slice(0, i).join("/");
    const entry = entries.find(
      (e) => e.data.locale === locale && e.data.slug === slug,
    );
    if (entry) {
      trail.push({ name: entry.data.title, url: pagePath(locale, slug) });
    }
  }
  return trail;
}
