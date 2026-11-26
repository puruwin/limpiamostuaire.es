import Contacto from "./Contacto.astro";
import EnlacePagina from "./EnlacePagina.astro";
import Municipios from "./Municipios.astro";
import PreciosDesde from "./PreciosDesde.astro";
import Pregunta from "./Pregunta.astro";
import Rejilla from "./Rejilla.astro";
import Seccion from "./Seccion.astro";
import Suplemento from "./Suplemento.astro";
import Tarjeta from "./Tarjeta.astro";
import Trabajos from "./Trabajos.astro";

// Bloques que las páginas .mdx usan sin importarlos: la ruta dinámica se los
// pasa a <Content components={bloques} />.
export const bloques = {
  Contacto,
  EnlacePagina,
  Municipios,
  PreciosDesde,
  Pregunta,
  Rejilla,
  Seccion,
  Suplemento,
  Tarjeta,
  Trabajos,
};
