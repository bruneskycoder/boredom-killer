"""Escribe en app/sw.js la lista de archivos a guardar offline y la versión (hash del contenido).

  python herramientas/generar_sw.py           regenera
  python herramientas/generar_sw.py --revisar  no escribe: falla si sw.js quedó desactualizado

Correrlo después de tocar cualquier archivo de app/."""
import hashlib
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent / "app"
SW = APP / "sw.js"
MARCAS = re.compile(r"// <generado>\n.*?// </generado>", re.S)


def archivos():
    rutas = sorted(p for p in APP.rglob("*") if p.is_file() and p != SW and p.name not in {".DS_Store", "Thumbs.db"})
    return [p.relative_to(APP).as_posix() for p in rutas]


def bloque():
    lista = archivos()
    h = hashlib.sha1()
    for ruta in lista:
        h.update(ruta.encode())
        h.update((APP / ruta).read_bytes().replace(b"\r\n", b"\n"))  # igual en Windows (CRLF) que en el servidor de publicación (LF)
    version = "bk-" + h.hexdigest()[:10]
    entradas = ["./"] + [f"./{r}" for r in lista]
    cuerpo = ",\n".join(f"  '{e}'" for e in entradas)
    return f"// <generado>\nconst VERSION = '{version}';\nconst ARCHIVOS = [\n{cuerpo},\n];\n// </generado>", version, len(entradas)


if __name__ == "__main__":
    nuevo, version, n = bloque()
    texto = SW.read_text(encoding="utf-8")
    if not MARCAS.search(texto):
        sys.exit("sw.js no tiene las marcas <generado>")
    resultado = MARCAS.sub(lambda m: nuevo, texto)
    if "--revisar" in sys.argv:
        if resultado != texto:
            sys.exit("sw.js está desactualizado: correr generar_sw.py")
        print(f"sw.js al día: {version}, {n} archivos")
    else:
        SW.write_text(resultado, encoding="utf-8", newline="\n")
        print(f"sw.js escrito: {version}, {n} archivos")
