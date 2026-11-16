"""Dibuja los íconos de la app (código propio): negro, dos marcas de registro en bermellón
(las mismas del cursor de las tarjetas) y una flecha de "jugar" al centro.

  python herramientas/iconos.py"""
from pathlib import Path

from PIL import Image, ImageDraw

SALIDA = Path(__file__).resolve().parent.parent / "app" / "iconos"
NEGRO, BERMELLON = (11, 12, 12), (255, 79, 46)


def dibujar(tam):
    s = 4  # se dibuja grande y se achica: bordes suaves
    n = tam * s
    img = Image.new("RGB", (n, n), NEGRO)
    d = ImageDraw.Draw(img)
    grosor, largo = round(n * 0.045), round(n * 0.17)
    a, b = round(n * 0.25), round(n * 0.75)  # esquinas dentro de la zona segura del ícono "maskable"
    # esquina superior izquierda y esquina inferior derecha
    d.rectangle([a, a, a + largo, a + grosor], fill=BERMELLON)
    d.rectangle([a, a, a + grosor, a + largo], fill=BERMELLON)
    d.rectangle([b - largo, b - grosor, b, b], fill=BERMELLON)
    d.rectangle([b - grosor, b - largo, b, b], fill=BERMELLON)
    # flecha de jugar, centrada ópticamente (un poco a la derecha)
    c, r = n * 0.5, n * 0.13
    d.polygon([(c - r * 0.8, c - r), (c - r * 0.8, c + r), (c + r * 1.1, c)], fill=BERMELLON)
    return img.resize((tam, tam), Image.LANCZOS)


if __name__ == "__main__":
    SALIDA.mkdir(parents=True, exist_ok=True)
    for nombre, tam in [("icono-192.png", 192), ("icono-512.png", 512), ("apple-touch-icon.png", 180)]:
        dibujar(tam).save(SALIDA / nombre, optimize=True)
        print(nombre, (SALIDA / nombre).stat().st_size, "bytes")
