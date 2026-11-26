import type { Locale } from "../i18n/locales.ts";

// Formatos de cifras, listas y fechas en el idioma de la página. Con Intl, así
// «85 €» y «€85», «A, B y C» y «A, B and C» salen de una sola llamada.

const intlLocale: Record<Locale, string> = { es: "es-ES", en: "en-GB" };

/** «85 €» en español y «€85» en inglés; sin decimales si es entero. */
export function euros(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** «Benidorm, Altea y Calp» / «Benidorm, Altea and Calp». */
export function lista(locale: Locale, items: readonly string[]): string {
  return new Intl.ListFormat(intlLocale[locale], {
    type: "conjunction",
  }).format(items);
}

/** «23 de diciembre» / «23 December», de una fecha "AAAA-MM-DD". */
export function diaYMes(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** Sustituye `{nombre}` en una cadena de ui.ts. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`fill: falta {${name}}`);
    return value;
  });
}
