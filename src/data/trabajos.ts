import type { ImageMetadata } from "astro";
import type { business } from "./business.ts";
import type { Locale } from "../i18n/locales.ts";

// Trabajos reales para el bloque «Trabajos reales» (src/components/bloques/
// Trabajos.astro). Solo fotos propias, con permiso por escrito y sin caras ni
// datos de la vivienda (M0.4); nunca imágenes hechas con IA (check:claims).
// Las fotos van en src/assets/trabajos/ y se importan aquí:
//
//   import antes from "../assets/trabajos/altea-salon-antes.jpg";
//
// Mientras la lista esté vacía, el bloque enseña un {{PENDIENTE, que bloquea
// el build de producción.

export interface Foto {
  src: ImageMetadata;
  alt: Record<Locale, string>;
}

export interface Trabajo {
  municipio: (typeof business.areaServed)[number];
  /** «Split de salón», «Cassette de oficina»… */
  equipo: Record<Locale, string>;
  antes: Foto;
  despues: Foto;
}

export const trabajos: readonly Trabajo[] = [];
