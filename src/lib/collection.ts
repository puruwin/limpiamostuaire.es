import { getCollection } from "astro:content";
import type { Locale } from "../i18n/locales.ts";
import { useTranslations } from "../i18n/ui.ts";
import {
  alternateLinks,
  breadcrumbTrail,
  languageLinks,
  pageUrlByKey,
  translationKeyByPath,
} from "./pages.ts";

// Acceso a la colección `pages` para los componentes (menú, pie, selector).
// La lógica está en pages.ts, sin astro:content, para poder probarla.

/** Claves de las páginas del menú y del pie. Las M2.x las usan tal cual. */
export const navKeys = [
  "precios",
  "como-lo-hacemos",
  "negocios",
  "conductos",
  "apartamentos-turisticos",
  "benidorm",
  "sobre-nosotros",
  "aviso-legal",
  "privacidad",
  "cookies",
] as const;

export type NavKey = (typeof navKeys)[number];

const entries = () => getCollection("pages");

/** URL de la página en `locale`, o undefined si todavía no existe. */
export async function urlOf(
  locale: Locale,
  translationKey: string,
): Promise<string | undefined> {
  return pageUrlByKey(await entries(), locale, translationKey);
}

/**
 * translationKey de la página con esa URL ("/negocios/"), para los bloques de
 * MDX. Falla si no hay ninguna: un bloque solo va dentro de una página.
 */
export async function translationKeyAt(path: string): Promise<string> {
  const key = translationKeyByPath(await entries(), path);
  if (key === undefined) throw new Error(`Ninguna página tiene la URL ${path}`);
  return key;
}

/** Enlaces de las claves que ya tienen página en `locale`, en ese orden. */
export async function existingLinks(
  locale: Locale,
  keys: readonly NavKey[],
): Promise<{ key: NavKey; url: string }[]> {
  const all = await entries();
  return keys.flatMap((key) => {
    const url = pageUrlByKey(all, locale, key);
    return url ? [{ key, url }] : [];
  });
}

export async function getLanguageLinks(
  locale: Locale,
  translationKey?: string,
) {
  return languageLinks(await entries(), locale, translationKey);
}

export async function getAlternateLinks(translationKey: string) {
  return alternateLinks(await entries(), translationKey);
}

export async function getBreadcrumbTrail(
  locale: Locale,
  translationKey: string,
) {
  const home = useTranslations(locale)("breadcrumb.home");
  return breadcrumbTrail(await entries(), locale, translationKey, home);
}
