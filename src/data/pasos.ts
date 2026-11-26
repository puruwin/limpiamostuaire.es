import type { Foto } from "./trabajos.ts";

// Fotos de cada paso de la limpieza de un split, para /como-lo-hacemos/
// (bloque <Paso foto>, src/components/bloques/Paso.astro). Las mismas reglas
// que src/data/trabajos.ts: solo fotos propias, con permiso por escrito y sin
// caras ni datos de la vivienda (M0.4); nunca imágenes hechas con IA
// (check:claims). Van en src/assets/pasos/ y se importan aquí:
//
//   import turbina from "../assets/pasos/turbina.jpg";
//   export const fotosPasos = { turbina: { src: turbina, alt: { es: "…", en: "…" } } };
//
// Un paso sin foto enseña un hueco con un {{PENDIENTE, que bloquea el build de
// producción.

export const pasos = [
  "antes",
  "proteccion",
  "filtros",
  "bateria",
  "turbina",
  "bandeja",
  "montaje",
  "despues",
] as const;

export type PasoId = (typeof pasos)[number];

export const fotosPasos: Partial<Record<PasoId, Foto>> = {};
