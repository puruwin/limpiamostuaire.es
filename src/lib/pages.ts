import { locales, localePrefix, type Locale } from "../i18n/locales.ts";

/** Lo mínimo de una entrada de la colección `pages` que hace falta para validar. */
export interface PageEntry {
  id: string;
  filePath?: string;
  data: {
    locale: Locale;
    translationKey: string;
    slug: string;
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
