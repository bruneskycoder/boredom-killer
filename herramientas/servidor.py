"""Servidor local de prueba. Sirve solo app/, muestra/ y pruebas/ (nunca docs/ ni .git).

  python herramientas/servidor.py          solo esta PC: http://localhost:8000/
  python herramientas/servidor.py --red    también el iPhone por wifi (imprime la dirección)

Fija los tipos de archivo (en Windows los .js pueden salir como texto y los módulos no cargan)
y desactiva el caché para ver siempre la última versión."""
import io
import posixpath
import socket
import sys
import urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PUBLICAS = ("app", "muestra", "pruebas")
PUERTO = 8000


class Manejador(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".html": "text/html; charset=utf-8",
        ".woff2": "font/woff2",
        ".webmanifest": "application/manifest+json",
    }

    def send_head(self):
        ruta = posixpath.normpath(urllib.parse.unquote(self.path.split("?", 1)[0].split("#", 1)[0]))
        partes = [p for p in ruta.split("/") if p]
        if not partes:
            enlaces = "".join(f'<p><a href="./{c}/">{c}/</a>' for c in PUBLICAS if (RAIZ / c).is_dir())
            cuerpo = f"<!doctype html><meta charset=utf-8><title>boredom-killer</title>{enlaces}".encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(cuerpo)))
            self.end_headers()
            return io.BytesIO(cuerpo)
        if partes[0] not in PUBLICAS:
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # no manda nada: solo averigua qué interfaz usaría
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


if __name__ == "__main__":
    red = "--red" in sys.argv
    servidor = ThreadingHTTPServer(("0.0.0.0" if red else "127.0.0.1", PUERTO), partial(Manejador, directory=str(RAIZ)))
    print(f"App:     http://localhost:{PUERTO}/app/", flush=True)
    print(f"Pruebas: http://localhost:{PUERTO}/pruebas/", flush=True)
    if red:
        print(f"En el iPhone: http://{ip_local() or '<ip de esta PC>'}:{PUERTO}/app/  (misma wifi; sin uso offline: eso pide https)", flush=True)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
