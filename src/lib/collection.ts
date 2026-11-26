import { getCollection } from "astro:content";
import type { Locale } from "../i18n/locales.ts";
import { languageLinks, pageUrlByKey } from "./pages.ts";

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
