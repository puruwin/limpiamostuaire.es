"""Genera los logos de Limpiamos tu aire y Ti&Di en SVG a partir de las fuentes reales.

Uso:  python brand/generar.py            (desde la raíz del repo)
Requiere: fonttools, uharfbuzz  (pip install fonttools uharfbuzz)
Los PNG se exportan después con resvg (ver DESIGN.md).
"""
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

BRAND = Path(__file__).resolve().parent
FUENTES = BRAND / "fuentes"

# ——— Paleta (DESIGN.md) ———
TINTA = "#12313f"
ACENTO = "#1f7a8c"
CALIDO = "#e3b98a"
FONDO = "#f7f3ec"
TIDI_GRIS = "#413d42"
TIDI_ROSA = "#f397a5"


class Fuente:
    def __init__(self, archivo, loc):
        self.path = str(FUENTES / archivo)
        self.tt = TTFont(self.path)
        self.loc = loc
        self.gs = self.tt.getGlyphSet(location=loc)
        self.upm = self.tt["head"].unitsPerEm
        blob = hb.Blob.from_file_path(self.path)
        self.hbf = hb.Font(hb.Face(blob))
        self.hbf.set_variations(loc)

    def shape(self, texto):
        buf = hb.Buffer()
        buf.add_str(texto)
        buf.guess_segment_properties()
        hb.shape(self.hbf, buf, {"kern": True, "liga": False})
        order = self.tt.getGlyphOrder()
        x = 0
        out = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            out.append((order[info.codepoint], texto[info.cluster], x + pos.x_offset, pos.y_offset))
            x += pos.x_advance
        return out, x

    def contornos(self, glifo, dx, dy, s):
        """Devuelve cada contorno del glifo como path SVG (y hacia abajo), escalado s, desplazado."""
        rec = DecomposingRecordingPen(self.gs)
        self.gs[glifo].draw(rec)
        contornos, actual = [], []
        for op, args in rec.value:
            actual.append((op, args))
            if op in ("closePath", "endPath"):
                contornos.append(actual)
                actual = []
        res = []
        for c in contornos:
            sp = SVGPathPen(None, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
            tp = TransformPen(sp, (s, 0, 0, -s, dx, dy))
            for op, args in c:
                getattr(tp, op)(*args)
            bp = BoundsPen(None)
            for op, args in c:
                getattr(bp, op)(*args)
            res.append((sp.getCommands(), bp.bounds))
        return res


def texto_paths(fuente, texto, x0, base, tam, color_de=None):
    """Lista de (d, color) por contorno. color_de(char, idx_contorno, bounds, n_contornos) -> color."""
    s = tam / fuente.upm
    glifos, avance = fuente.shape(texto)
    out = []
    for nombre, ch, x, y in glifos:
        cs = fuente.contornos(nombre, x0 + x * s, base - y * s, s)
        for i, (d, b) in enumerate(cs):
            out.append((d, color_de(ch, i, b, cs) if color_de else None))
    return out, avance * s


def agrupar(paths, por_defecto):
    """Une contornos del mismo color en un solo <path>."""
    grupos = {}
    for d, c in paths:
        grupos.setdefault(c or por_defecto, []).append(d)
    return "".join(f'<path fill="{c}" d="{" ".join(ds)}"/>' for c, ds in grupos.items())


def svg(w, h, cuerpo, titulo, vb_x=0, vb_y=0):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:g} {vb_y:g} {w:g} {h:g}" '
        f'width="{w:g}" height="{h:g}" role="img" aria-label="{titulo}">'
        f"<title>{titulo}</title>{cuerpo}</svg>\n"
    )


# ——— Símbolo: «l» con remolino ———
# Dibujado en una caja de 48. El grosor se ajusta al asta de la «l» de Figtree Bold.
REMOLINO = "M18 5 V27.5 C18 37 24.5 42.6 31.5 42 C38.6 41.4 41.6 33.6 37 29.9 C33 26.8 27.6 29.6 29.4 34.2"
REMOLINO_TRAZO = 6.4
# Variante para 16–32 px: gancho abierto, sin bucle interior (el bucle se cierra en un borrón)
GANCHO = "M18 5 V28 C18 37.5 24.5 42.6 31.5 42 C38 41.4 41.2 35.6 39.4 31"


def simbolo(color, x, y, escala, trazo=REMOLINO_TRAZO, d=REMOLINO):
    return (
        f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{trazo}" '
        f'stroke-linecap="round" stroke-linejoin="round" '
        f'transform="translate({x:g} {y:g}) scale({escala:g})"/>'
    )


def main():
    fig700 = Fuente("Figtree.ttf", {"wght": 700})
    fig500 = Fuente("Figtree.ttf", {"wght": 500})
    fre700 = Fuente("Fredoka.ttf", {"wght": 700, "wdth": 100})

    out = BRAND / "limpiamostuaire"
    out.mkdir(exist_ok=True)
    tidi = BRAND / "tidi"
    tidi.mkdir(exist_ok=True)

    # —— Wordmark «limpiamos tu aire» a tamaño 100 ——
    T = 100.0
    s = T / 1000
    asta = (189.0 - 57.0) * s  # asta de la «l» Bold = 13.2
    # El símbolo mide 1,55 veces la «l» y su trazo es un 15 % más grueso que el asta
    altura_l = 70.0
    sx0, sy0, sx1, sy1 = 18 - REMOLINO_TRAZO / 2, 5 - REMOLINO_TRAZO / 2, 41.9 + REMOLINO_TRAZO / 2, 42.6 + REMOLINO_TRAZO / 2
    k = 1.55 * altura_l / (sy1 - sy0)
    trazo_lockup = asta * 1.15 / k
    alto_sim = (sy1 - sy0) * k
    ancho_sim = (sx1 - sx0) * k
    # Centrar el símbolo en la altura de la «l» (de 0 a 70)
    base = 0.0
    top_sim = base - altura_l / 2 - alto_sim / 2
    hueco = 0.30 * T

    def lockup(c_sim, c_txt, c_tu):
        p1, w1 = texto_paths(fig700, "limpiamos", 0, 0, T)
        esp = fig700.shape(" ")[1] * s
        p2, w2 = texto_paths(fig500, "tu aire", 0, 0, T)
        x_txt = ancho_sim + hueco
        cuerpo = simbolo(c_sim, -sx0 * k, top_sim - sy0 * k, k, trazo_lockup)
        cuerpo += f'<g transform="translate({x_txt:g} 0)">{agrupar(p1, c_txt)}'
        cuerpo += f'<g transform="translate({w1 + esp:g} 0)">{agrupar(p2, c_tu)}</g></g>'
        ancho = x_txt + w1 + esp + w2
        y0 = min(top_sim, -73.3) - 2
        y1 = max(top_sim + alto_sim, 0) + 2
        return cuerpo, ancho, y0, y1 - y0

    for nombre, cs, ct, cu, tit in [
        ("logo-horizontal.svg", ACENTO, TINTA, TINTA, "Limpiamos tu aire"),
        ("logo-horizontal-invertido.svg", "#9fd3dc", FONDO, FONDO, "Limpiamos tu aire"),
        ("logo-horizontal-negro.svg", "#000", "#000", "#000", "Limpiamos tu aire"),
        ("logo-horizontal-blanco.svg", "#fff", "#fff", "#fff", "Limpiamos tu aire"),
    ]:
        cuerpo, w, y0, h = lockup(cs, ct, cu)
        pad = 4
        (out / nombre).write_text(svg(w + 2 * pad, h, cuerpo, tit, -pad, y0))

    # —— Imagen para compartir (Open Graph), 1200×630: logo sobre fondo ——
    # La miniatura pequeña (WhatsApp, Telegram) recorta un cuadrado por el
    # centro: el logo cabe en él (540 px de ancho dentro de 630).
    cuerpo, w, y0, h = lockup(ACENTO, TINTA, TINTA)
    OG_W, OG_H = 1200, 630
    e = 540 / w
    ox = (OG_W - w * e) / 2
    oy = (OG_H - h * e) / 2 - y0 * e
    og = f'<rect width="{OG_W}" height="{OG_H}" fill="{FONDO}"/>'
    og += f'<g transform="translate({ox:g} {oy:g}) scale({e:g})">{cuerpo}</g>'
    (out / "og.svg").write_text(svg(OG_W, OG_H, og, "Limpiamos tu aire"))

    # —— Símbolo suelto ——
    def simbolo_svg(color, fondo=None, redondo=False, trazo=REMOLINO_TRAZO, margen=0.0, d=REMOLINO):
        lado = 48.0
        cx0, cy0, cx1, cy1 = 18 - trazo / 2, 5 - trazo / 2, 41.9 + trazo / 2, 42.6 + trazo / 2
        if fondo:
            # El remolino ocupa ~62 % del lado, centrado ópticamente
            e = (lado * (1 - 2 * margen)) / max(cx1 - cx0, cy1 - cy0)
            ox = (lado - (cx1 - cx0) * e) / 2 - cx0 * e
            oy = (lado - (cy1 - cy0) * e) / 2 - cy0 * e
            r = lado / 2 if redondo else lado * 0.22
            bg = f'<rect width="48" height="48" rx="{r:g}" fill="{fondo}"/>'
            return svg(lado, lado, bg + simbolo(color, ox, oy, e, trazo, d), "Limpiamos tu aire")
        w, h = cx1 - cx0, cy1 - cy0
        return svg(w, h, simbolo(color, 0, 0, 1, trazo), "Limpiamos tu aire", cx0, cy0)

    (out / "simbolo.svg").write_text(simbolo_svg(ACENTO))
    (out / "simbolo-negro.svg").write_text(simbolo_svg("#000"))
    (out / "simbolo-blanco.svg").write_text(simbolo_svg("#fff"))
    (out / "icono-cuadrado.svg").write_text(simbolo_svg(FONDO, ACENTO, margen=0.15))
    (out / "icono-redondo.svg").write_text(simbolo_svg(FONDO, ACENTO, redondo=True, margen=0.2))
    # Favicon: trazo más grueso y menos margen para que aguante a 16 px
    (out / "favicon.svg").write_text(simbolo_svg(FONDO, ACENTO, trazo=8.6, margen=0.12, d=GANCHO))

    # —— Ti&Di (Fredoka Bold) ——
    def color_tidi(rosa_amp=TIDI_ROSA, gris=TIDI_GRIS, rosa_punto=TIDI_ROSA):
        def f(ch, i, b, cs):
            if ch == "&":
                return rosa_amp
            if ch == "i" and len(cs) > 1:
                # El punto es el contorno más alto
                alto = max(range(len(cs)), key=lambda j: cs[j][1][1])
                return rosa_punto if i == alto else gris
            return gris
        return f

    def destello(cx, cy, r, color):
        a = r * 0.16
        return (
            f'<path fill="{color}" d="M{cx:g} {cy - r:g} Q{cx + a:g} {cy - a:g} {cx + r:g} {cy:g} '
            f'Q{cx + a:g} {cy + a:g} {cx:g} {cy + r:g} Q{cx - a:g} {cy + a:g} {cx - r:g} {cy:g} '
            f'Q{cx - a:g} {cy - a:g} {cx:g} {cy - r:g}Z"/>'
        )

    for nombre, fn, chispa, tit in [
        ("wordmark.svg", color_tidi(), TIDI_ROSA, "Ti&Di"),
        ("wordmark-negro.svg", color_tidi("#000", "#000", "#000"), "#000", "Ti&Di"),
        ("wordmark-blanco.svg", color_tidi("#fff", "#fff", "#fff"), "#fff", "Ti&Di"),
    ]:
        paths, w = texto_paths(fre700, "Ti&Di", 0, 0, T, fn)
        cuerpo = agrupar(paths, TIDI_GRIS)
        r = 0.11 * T
        cuerpo += destello(w + r * 0.55, -73 - r * 0.25, r, chispa)
        x1 = w + r * 1.6
        y0 = -73 - r * 1.3
        tidi_svg = svg(x1 + 4, 2 - y0, cuerpo, "Ti&amp;Di", -4, y0)
        (tidi / nombre).write_text(tidi_svg)

    # Monograma T&D en círculo rosa (favicon / avatar sin ilustración)
    paths, w = texto_paths(fre700, "T&D", 0, 0, 100)
    cuerpo = '<circle cx="48" cy="48" r="48" fill="%s"/>' % TIDI_ROSA
    cuerpo += f'<g transform="translate({48 - w * 0.36 / 2:g} {48 + 70 * 0.36 / 2:g}) scale(0.36)">{agrupar(paths, "#fff")}</g>'
    cuerpo += destello(70, 24, 6.5, "#fff")
    (tidi / "monograma.svg").write_text(svg(96, 96, cuerpo, "Ti&amp;Di"))

    print("SVG generados en", out, "y", tidi)


if __name__ == "__main__":
    main()
