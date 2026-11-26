import type { Locale } from "../i18n/locales.ts";

// Tarifa del 24-11-2026: única fuente para los datos estructurados
// (src/lib/structured-data.ts) y para los bloques de precios de las páginas
// (src/components/bloques/), así lo que se ve y el schema no se separan.
// Tiene que coincidir con la tabla y los servicios de la ficha de Google
// (docs/ficha-google.md#tarifa).
// A los particulares, siempre con IVA (normativa de consumidores); a los
// negocios, sin IVA y con factura.

export type Segment = "vivienda" | "negocio";

export interface Tarifa {
  segment: Segment;
  /** Splits en la misma visita; "adicional" es cada uno a partir del cuarto. */
  splits: 1 | 2 | 3 | "adicional";
  /** Euros. */
  price: number;
  vatIncluded: boolean;
  /** Los nombres en español son los de los servicios de la ficha. */
  name: Record<Locale, string>;
}

export const tarifa: readonly Tarifa[] = [
  {
    segment: "vivienda",
    splits: 1,
    price: 85,
    vatIncluded: true,
    name: {
      es: "Limpieza de 1 split en vivienda",
      en: "Cleaning of 1 split unit at home",
    },
  },
  {
    segment: "vivienda",
    splits: 2,
    price: 150,
    vatIncluded: true,
    name: {
      es: "Limpieza de 2 splits en vivienda",
      en: "Cleaning of 2 split units at home",
    },
  },
  {
    segment: "vivienda",
    splits: 3,
    price: 210,
    vatIncluded: true,
    name: {
      es: "Limpieza de 3 splits en vivienda",
      en: "Cleaning of 3 split units at home",
    },
  },
  {
    segment: "vivienda",
    splits: "adicional",
    price: 55,
    vatIncluded: true,
    name: {
      es: "Split adicional en vivienda",
      en: "Each additional split unit at home",
    },
  },
  {
    segment: "negocio",
    splits: 1,
    price: 110,
    vatIncluded: false,
    name: {
      es: "Limpieza de 1 split en negocio (+ IVA)",
      en: "Cleaning of 1 split unit for businesses (+ VAT)",
    },
  },
  {
    segment: "negocio",
    splits: 2,
    price: 200,
    vatIncluded: false,
    name: {
      es: "Limpieza de 2 splits en negocio (+ IVA)",
      en: "Cleaning of 2 split units for businesses (+ VAT)",
    },
  },
  {
    segment: "negocio",
    splits: 3,
    price: 260,
    vatIncluded: false,
    name: {
      es: "Limpieza de 3 splits en negocio (+ IVA)",
      en: "Cleaning of 3 split units for businesses (+ VAT)",
    },
  },
  {
    segment: "negocio",
    splits: "adicional",
    price: 55,
    vatIncluded: false,
    name: {
      es: "Split adicional en negocio (+ IVA)",
      en: "Each additional split unit for businesses (+ VAT)",
    },
  },
];

/** Desde cuánto cuesta un split en cada segmento: el precio de 1 split. */
export function desde(segment: Segment): Tarifa {
  const line = tarifa.find((t) => t.segment === segment && t.splits === 1);
  if (!line) throw new Error(`tarifa: falta 1 split de ${segment}`);
  return line;
}

/**
 * Suplementos por visita, en euros (con IVA en casa, sin IVA en negocio). No
 * son servicios de la ficha: van al final de cada descripción.
 */
export const suplementos = {
  /** Fuera de los municipios de business.areaServed. */
  fueraDeZona: { vivienda: 18, negocio: 15 },
  /** Unidad exterior a la que se llega sin trabajar en altura. */
  exteriorSinAltura: 20,
} as const satisfies {
  fueraDeZona: Record<Segment, number>;
  exteriorSinAltura: number;
};

/**
 * Precio de lanzamiento: 1 split en casa, IVA incluido, hasta `hasta`
 * (incluido, hora de Madrid). En la ficha está publicado como Oferta con la
 * misma fecha de fin. La web lo enseña solo si el build es de esa fecha o
 * anterior: pasada, hace falta un despliegue para quitarlo.
 */
export const lanzamiento = {
  segment: "vivienda",
  splits: 1,
  price: 59,
  vatIncluded: true,
  hasta: "2026-12-23",
} as const satisfies Omit<Tarifa, "name"> & { hasta: string };

/** Fecha "AAAA-MM-DD" de `now` en Madrid. */
export function fechaMadrid(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
  }).format(now);
}

/** true si el precio de lanzamiento sigue vigente el día de `now` en Madrid. */
export function lanzamientoVigente(now: Date = new Date()): boolean {
  return fechaMadrid(now) <= lanzamiento.hasta;
}
