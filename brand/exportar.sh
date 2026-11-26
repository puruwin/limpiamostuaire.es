#!/bin/bash
# Exporta los PNG de los logos a partir de los SVG. Requiere resvg e ImageMagick.
# Uso: brand/exportar.sh   (desde la raíz del repo, después de brand/generar.py)
set -euo pipefail
B="$(cd "$(dirname "$0")" && pwd)"
L="$B/limpiamostuaire"; T="$B/tidi"
mkdir -p "$L/png" "$T/png"

# Favicon e iconos de la web
resvg -w 16  "$L/favicon.svg" "$L/png/favicon-16.png"
resvg -w 32  "$L/favicon.svg" "$L/png/favicon-32.png"
resvg -w 48  "$L/favicon.svg" "$L/png/favicon-48.png"
magick "$L/png/favicon-16.png" "$L/png/favicon-32.png" "$L/png/favicon-48.png" "$L/favicon.ico"
rm "$L/png/favicon-16.png" "$L/png/favicon-48.png"
# apple-touch-icon: sin transparencia ni esquinas (iOS las redondea)
resvg -w 180 "$L/icono-cuadrado.svg" "$L/png/tmp.png"
magick -size 180x180 "xc:#1f7a8c" "$L/png/tmp.png" -composite "$L/png/apple-touch-icon.png"; rm "$L/png/tmp.png"
resvg -w 192 "$L/icono-cuadrado.svg" "$L/png/icono-192.png"
resvg -w 512 "$L/icono-cuadrado.svg" "$L/png/icono-512.png"
resvg -w 1024 "$L/icono-redondo.svg" "$L/png/icono-redondo-1024.png"
resvg -w 1200 "$L/logo-horizontal.svg" "$L/png/logo-horizontal-1200.png"
resvg -w 1200 "$L/logo-horizontal-invertido.svg" "$L/png/logo-horizontal-invertido-1200.png"
# Open Graph por defecto: se sirve tal cual desde public/ (Seo.astro)
resvg -w 1200 "$L/og.svg" "$L/png/og-1200x630.png"
cp "$L/png/og-1200x630.png" "$B/../public/og.png"
# Logo de los datos estructurados (Organization.logo): cuadrado, ≥112 px
cp "$L/png/icono-512.png" "$B/../public/logo.png"

# Ti&Di
resvg -w 1200 "$T/wordmark.svg" "$T/png/wordmark-1200.png"
resvg -w 512  "$T/monograma.svg" "$T/png/monograma-512.png"
# Avatar con la ilustración (ficha de Google, bloque de operador)
magick "$T/original/identidad-chatgpt.png" -crop 490x490+853+143 +repage -resize 512x512 \
  \( -size 512x512 xc:black -fill white -draw "circle 256,256 256,1" \) -alpha off -compose CopyOpacity -composite \
  "$T/png/avatar-512.png"
magick "$T/png/avatar-512.png" -resize 128x128 -quality 85 "$T/png/avatar-128.webp"
echo "PNG exportados en $L/png y $T/png"
