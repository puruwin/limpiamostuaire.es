import type { Locale } from "./locales.ts";

// Cadenas de interfaz. `es` define las claves; a `en` no le puede faltar ni
// sobrar ninguna: si pasa, `npm run check` falla.

const es = {
  "site.name": "Limpiamos tu aire",
  "a11y.skipToContent": "Saltar al contenido",
  "placeholder.h1": "Limpieza de aires acondicionados en profundidad",
  "placeholder.text": "Web en construcción.",
};

export type UiKey = keyof typeof es;

const en = {
  "site.name": "Limpiamos tu aire",
  "a11y.skipToContent": "Skip to content",
  "placeholder.h1": "Deep cleaning for air conditioners",
  "placeholder.text": "Website under construction.",
};

export const ui = { es, en } satisfies Record<Locale, Record<UiKey, string>>;

/** Devuelve `t(clave)` con las cadenas del idioma. */
export function useTranslations(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}
