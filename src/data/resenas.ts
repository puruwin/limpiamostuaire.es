// Reseñas de clientes para el bloque <Resenas /> (src/components/bloques/
// Resenas.astro). Solo reseñas reales de la ficha de Google de Ti&Di, copiadas
// tal cual, con el permiso de quien la escribió para publicar su nombre de
// pila. Nunca inventadas ni retocadas. Mientras la lista esté vacía, el bloque
// no pinta nada.
// No llevan datos estructurados: Google no enseña estrellas de las reseñas que
// un negocio publica sobre sí mismo.

export interface Resena {
  /** Nombre de pila, como sale en la ficha. */
  autor: string;
  /** Texto tal cual, en el idioma en que se escribió. */
  texto: string;
  /** Idioma del texto (atributo lang). */
  idioma: "es" | "en" | "ca";
  /** Fecha de la reseña, "AAAA-MM-DD". */
  fecha: string;
}

export const resenas: readonly Resena[] = [];
