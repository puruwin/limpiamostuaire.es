---
name: Limpiamos tu aire
description: Limpieza en profundidad de aires acondicionados. Marca paraguas con operadores locales (Ti&Di en Benidorm).
colors:
  tinta: "#12313f"
  acento: "#1f7a8c"
  acento-texto: "#176474"
  calido: "#e3b98a"
  fondo: "#f7f3ec"
  suave: "#e2eeec"
  agua-clara: "#9fd3dc"
  papel: "#ffffff"
operadores:
  tidi:
    gris: "#413d42"
    rosa: "#f397a5"
    rosa-claro: "#f7c2cb"
typography:
  marca:
    fontFamily: "Figtree, system-ui, sans-serif"
    weights: [400, 500, 700]
  operador-tidi:
    fontFamily: "Fredoka"
    fontWeight: 700
    uso: "solo el wordmark de Ti&Di, ya trazado en SVG; no se carga en la web"
---

# Design System: Limpiamos tu aire

<!-- Identidad decidida en la entrevista de M0.6 (25-11-2026). Los componentes, la escala tipográfica y el modo oscuro se fijan en M1.4. -->

## Jerarquía de marcas

- **Limpiamos tu aire** es la marca de la web y del servicio. Su identidad es neutra respecto al operador para poder replicarla en otras localidades (M7.2).
- **Ti&Di** (Tamar y David) es el **operador en Benidorm**. En la web aparece como bloque de operador («Tu operador en Benidorm: Ti&Di»), en `/benidorm/`, en _Sobre nosotros_ y en el pie, nunca en la cabecera junto al logo paraguas.
- La ficha de Google es de Ti&Di y usa su avatar; la web enlaza desde la ficha a `/benidorm/`.
- El rosa es de Ti&Di. El paraguas no lo usa, para que cada operador conserve su color.

## Paleta (A · Mar y arena)

| Token          | Hex       | Uso                                                                                                                |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `tinta`        | `#12313f` | Texto, botón principal, fondo de bloques oscuros                                                                   |
| `acento`       | `#1f7a8c` | Símbolo, iconos, fondos de icono/favicon. Como texto sobre `fondo` está justo en 4,5:1: úsalo solo en texto grande |
| `acento-texto` | `#176474` | Enlaces y texto pequeño en color sobre `fondo` (6,1:1)                                                             |
| `calido`       | `#e3b98a` | Acento cálido de superficie (bloque de operador, detalles). Nunca para texto (1,6:1 sobre `fondo`)                 |
| `fondo`        | `#f7f3ec` | Fondo de página (arena clara)                                                                                      |
| `suave`        | `#e2eeec` | Chips y superficies secundarias                                                                                    |
| `agua-clara`   | `#9fd3dc` | Símbolo sobre `tinta` (logo invertido)                                                                             |

Contrastes comprobados: `tinta`/`fondo` 12,4:1 · `tinta`/`suave` 11,5:1 · `tinta`/`calido` 7,5:1 · `fondo`/`acento` 4,5:1 · `agua-clara`/`tinta` 8,4:1.

## Tipografía

- **Figtree** (OFL) para todo: wordmark y web. Pesos 400 (texto), 500 («tu aire» en el wordmark, subtítulos) y 700 (titulares, «limpiamos»). En M1.1 se autoaloja como variable desde `brand/fuentes/Figtree.ttf` (o `@fontsource-variable/figtree`); no se carga desde Google Fonts.
- **Fredoka Bold** solo existe dentro del wordmark de Ti&Di, ya trazado. La web no la carga.

## Logo de Limpiamos tu aire

- **Símbolo:** una «l» cuya cola termina en un remolino de aire. Es un trazo con remate redondo; en el lockup su grosor es un 15 % mayor que el asta de la «l» de Figtree Bold y mide 1,55 veces su altura.
- **Wordmark:** «limpiamos tu aire», en minúsculas y como frase; «limpiamos» va en 700 y «tu aire» en 500.
- **Favicon:** variante «gancho», sin bucle interior y con trazo más grueso, porque a 16 px el bucle se cierra y se lee como una «b».
- **Área de respeto:** la altura de la «x» del wordmark alrededor de todo el logo.
- **Tamaño mínimo:** 120 px de ancho para el horizontal; por debajo, solo el símbolo.
- No se recolorea, no se separa el símbolo del texto en el horizontal y no se pone sobre fotos sin una banda de `tinta` o `fondo`.

| Archivo (`brand/limpiamostuaire/`)                                   | Para                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `logo-horizontal.svg`                                                | Cabecera de la web sobre `fondo` o blanco                    |
| `logo-horizontal-invertido.svg`                                      | Sobre `tinta` (pie, bloques oscuros)                         |
| `logo-horizontal-negro.svg` / `-blanco.svg`                          | Una tinta: facturas, sellos, vinilos, bordado                |
| `simbolo.svg`, `simbolo-negro.svg`, `simbolo-blanco.svg`             | Símbolo suelto                                               |
| `icono-cuadrado.svg`, `icono-redondo.svg`                            | Redes y avatares de la marca paraguas                        |
| `favicon.svg`, `favicon.ico`                                         | Favicon (SVG para navegadores modernos e ICO de 16/32/48 px) |
| `png/apple-touch-icon.png`, `png/icono-192.png`, `png/icono-512.png` | iOS y manifest                                               |

## Ti&Di (operador en Benidorm)

- Base: `brand/tidi/original/identidad-chatgpt.png`. La ilustración la generó ChatGPT (C2PA, 02-10-2026).
- **Ilustración de la pareja:** solo como avatar o logo (ficha de Google y bloque de operador). No se usa como ilustración decorativa ni sustituye a fotos reales de trabajos o de Tamar y David (M0.4).
- **Wordmark** rehecho con Fredoka Bold: «T» y «D» en `gris`, y «&» y los puntos de las íes en `rosa`, con el destello rosa arriba a la derecha.
- **Monograma** «T&D» blanco sobre círculo `rosa`, para cuando la ilustración no cabe.

| Archivo (`brand/tidi/`)                                     | Para                                         |
| ----------------------------------------------------------- | -------------------------------------------- |
| `wordmark.svg`, `wordmark-negro.svg`, `wordmark-blanco.svg` | Logo de Ti&Di                                |
| `monograma.svg`                                             | Icono pequeño                                |
| `png/avatar-512.png`, `png/avatar-128.webp`                 | Avatar ilustrado (ficha, bloque de operador) |

## Regenerar

Los SVG salen de las fuentes reales; no se editan a mano.

```bash
python -m venv .venv && .venv/bin/pip install fonttools uharfbuzz
.venv/bin/python brand/generar.py   # SVG (texto trazado con kerning de HarfBuzz)
brand/exportar.sh                   # PNG e ICO (resvg + ImageMagick)
```
