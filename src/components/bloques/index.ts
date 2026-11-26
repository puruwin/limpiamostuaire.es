import Contacto from "./Contacto.astro";
import Ejemplo from "./Ejemplo.astro";
import EnlacePagina from "./EnlacePagina.astro";
import Lanzamiento from "./Lanzamiento.astro";
import Municipios from "./Municipios.astro";
import Paso from "./Paso.astro";
import Pasos from "./Pasos.astro";
import PreciosDesde from "./PreciosDesde.astro";
import Pregunta from "./Pregunta.astro";
import Rejilla from "./Rejilla.astro";
import Seccion from "./Seccion.astro";
import Suplemento from "./Suplemento.astro";
import TablaPrecios from "./TablaPrecios.astro";
import Tarjeta from "./Tarjeta.astro";
import Trabajos from "./Trabajos.astro";

// Bloques que las páginas .mdx usan sin importarlos: la ruta dinámica se los
// pasa a <Content components={bloques} />.
export const bloques = {
  Contacto,
  Ejemplo,
  EnlacePagina,
  Lanzamiento,
  Municipios,
  Paso,
  Pasos,
  PreciosDesde,
  Pregunta,
  Rejilla,
  Seccion,
  Suplemento,
  TablaPrecios,
  Tarjeta,
  Trabajos,
};
