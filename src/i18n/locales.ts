/** Idiomas del sitio. El español va en la raíz; el inglés, en /en/. */
export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/** Prefijo de ruta del idioma, sin barra final: "" para es, "/en" para en. */
export function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/** Locale de Open Graph (`og:locale`). `<html lang>` y `hreflang` usan el código corto. */
export const ogLocale: Record<Locale, string> = {
  es: "es_ES",
  en: "en_GB",
};
