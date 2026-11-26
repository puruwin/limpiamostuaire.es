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

/** La línea de la tarifa de un segmento y un número de splits. */
export function precio(segment: Segment, splits: Tarifa["splits"]): Tarifa {
  const line = tarifa.find((t) => t.segment === segment && t.splits === splits);
  if (!line) throw new Error(`tarifa: falta ${splits} de ${segment}`);
  return line;
}

/** Desde cuánto cuesta un split en cada segmento: el precio de 1 split. */
export function desde(segment: Segment): Tarifa {
  return precio(segment, 1);
}

/**
 * Suplementos, en euros (con IVA en casa, sin IVA en negocio). No son
 * servicios de la ficha: van al final de cada descripción.
 */
export const suplementos = {
  /** Por visita, fuera de los municipios de business.areaServed. */
  fueraDeZona: { vivienda: 18, negocio: 15 },
  /** Por cada unidad exterior a la que se llega sin trabajar en altura. */
  exteriorSinAltura: 20,
} as const satisfies {
  fueraDeZona: Record<Segment, number>;
  exteriorSinAltura: number;
};

/**
 * Precio de lanzamiento: 1 split en casa, IVA incluido, hasta `hasta`
 * (incluido, hora de Madrid). Con más splits en la misma visita, el primero
 * sale a este precio y cada uno de los demás al del split adicional (decidido
 * el 26-11-2026). En la ficha está publicado como Oferta con la
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

/** Lo que se pide en una visita, para calcular un presupuesto. */
export interface Encargo {
  segment: Segment;
  /** Splits en la misma visita: 1 o más. */
  splits: number;
  /** Unidades exteriores a las que se llega sin trabajar en altura. */
  exteriores?: number;
  /** Fuera de los municipios de business.areaServed. */
  fueraDeZona?: boolean;
  /** Con el precio de lanzamiento (solo en casa). */
  conLanzamiento?: boolean;
}

export type Concepto =
  "splits" | "lanzamiento" | "adicionales" | "exteriores" | "fueraDeZona";

export interface LineaPresupuesto {
  concepto: Concepto;
  /** Splits, unidades exteriores o visitas de la línea. */
  cantidad: number;
  /** Euros de la línea entera. */
  importe: number;
}

export interface Presupuesto {
  lineas: LineaPresupuesto[];
  total: number;
  vatIncluded: boolean;
}

/**
 * Presupuesto de una visita con la tarifa: el precio de hasta 3 splits, el
 * adicional por cada uno a partir del cuarto y los suplementos. Con el precio
 * de lanzamiento, el primer split a ese precio y los demás al del adicional.
 */
export function presupuesto({
  segment,
  splits,
  exteriores = 0,
  fueraDeZona = false,
  conLanzamiento = false,
}: Encargo): Presupuesto {
  if (!Number.isInteger(splits) || splits < 1) {
    throw new Error(
      `presupuesto: splits tiene que ser un entero ≥ 1 (${splits})`,
    );
  }
  if (!Number.isInteger(exteriores) || exteriores < 0 || exteriores > splits) {
    throw new Error(
      `presupuesto: exteriores tiene que ser un entero entre 0 y ${splits} (${exteriores})`,
    );
  }
  if (conLanzamiento && segment !== lanzamiento.segment) {
    throw new Error("presupuesto: el precio de lanzamiento es solo en casa");
  }

  const adicional = precio(segment, "adicional");
  const lineas: LineaPresupuesto[] = [];
  const adicionales = (cantidad: number) => {
    if (cantidad > 0) {
      lineas.push({
        concepto: "adicionales",
        cantidad,
        importe: cantidad * adicional.price,
      });
    }
  };

  if (conLanzamiento) {
    lineas.push({
      concepto: "lanzamiento",
      cantidad: 1,
      importe: lanzamiento.price,
    });
    adicionales(splits - 1);
  } else {
    const base = Math.min(splits, 3) as 1 | 2 | 3;
    lineas.push({
      concepto: "splits",
      cantidad: base,
      importe: precio(segment, base).price,
    });
    adicionales(splits - base);
  }
  if (exteriores > 0) {
    lineas.push({
      concepto: "exteriores",
      cantidad: exteriores,
      importe: exteriores * suplementos.exteriorSinAltura,
    });
  }
  if (fueraDeZona) {
    lineas.push({
      concepto: "fueraDeZona",
      cantidad: 1,
      importe: suplementos.fueraDeZona[segment],
    });
  }

  return {
    lineas,
    total: lineas.reduce((sum, linea) => sum + linea.importe, 0),
    vatIncluded: adicional.vatIncluded,
  };
}
