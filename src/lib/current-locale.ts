import { locales, type Locale } from "../i18n/locales.ts";

/**
 * Idioma de la página desde `Astro.currentLocale`, para los bloques de MDX
 * (src/components/bloques/), que no reciben el idioma por props.
 */
export function asLocale(value: string | undefined): Locale {
  const locale = locales.find((l) => l === value);
  if (!locale) throw new Error(`Idioma desconocido: ${String(value)}`);
  return locale;
}
