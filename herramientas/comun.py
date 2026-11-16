"""Utilidades compartidas por los scripts de datos (solo biblioteca estándar)."""
import json, os, urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRUDO = os.path.join(RAIZ, "herramientas", "crudo")
SALIDA = os.path.join(RAIZ, "app", "datos")
os.makedirs(CRUDO, exist_ok=True)
os.makedirs(SALIDA, exist_ok=True)

NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"


def bajar(url, nombre=None):
    """Baja una sola vez a herramientas/crudo/ y devuelve la ruta local."""
    ruta = os.path.join(CRUDO, nombre or url.rsplit("/", 1)[-1])
    if not os.path.exists(ruta):
        print(f"  bajando {url}")
        req = urllib.request.Request(url, headers={"User-Agent": "boredom-killer-datos"})
        with urllib.request.urlopen(req, timeout=300) as r, open(ruta, "wb") as f:
            f.write(r.read())
    return ruta


def cargar_json(ruta):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def guardar(nombre, datos):
    ruta = os.path.join(SALIDA, nombre)
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
    kb = os.path.getsize(ruta) / 1024
    print(f"  -> app/datos/{nombre}: {kb:.1f} KB")
    return ruta


def _dist_seg(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return ((x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2) ** 0.5


def douglas_peucker(pts, tol):
    if len(pts) < 3:
        return pts
    marca = [False] * len(pts)
    marca[0] = marca[-1] = True
    pila = [(0, len(pts) - 1)]
    while pila:
        i, j = pila.pop()
        mx, k = 0, None
        for m in range(i + 1, j):
            d = _dist_seg(pts[m], pts[i], pts[j])
            if d > mx:
                mx, k = d, m
        if k is not None and mx > tol:
            marca[k] = True
            pila += [(i, k), (k, j)]
    return [p for p, mk in zip(pts, marca) if mk]


def area_caja(anillo):
    xs = [p[0] for p in anillo]
    ys = [p[1] for p in anillo]
    return (max(xs) - min(xs)) * (max(ys) - min(ys))


def anillos(geom, tol, area_min, dec=2):
    """Anillos exteriores simplificados, como listas planas [x,y,x,y...]."""
    polis = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    res = []
    for poli in polis:
        ext = [tuple(p[:2]) for p in poli[0]]
        if area_caja(ext) < area_min:
            continue
        s = douglas_peucker(ext, tol)
        if len(s) < 4:
            continue
        res.append([round(c, dec) for p in s for c in p])
    return res


def ciudades(feats, pais_a3, n_pop, es=True, excluir=()):
    """Ciudades de Natural Earth: capitales (país y provincia) + las n_pop más pobladas.
    es=False usa el nombre local (NAME) en vez de la traducción al español."""
    sel = [f["properties"] for f in feats
           if f["properties"].get("ADM0_A3") == pais_a3 and f["properties"]["NAME"] not in excluir]
    sel.sort(key=lambda p: -(p.get("POP_MAX") or 0))
    out, vistos = [], set()
    for i, p in enumerate(sel):
        cap = "capital" in (p.get("FEATURECLA") or "").lower()
        if i < n_pop or cap:
            nombre = (p.get("NAME_ES") if es else None) or p.get("NAME")
            if nombre in vistos:
                continue
            vistos.add(nombre)
            out.append({"nombre": nombre, "lon": round(p["LONGITUDE"], 3),
                        "lat": round(p["LATITUDE"], 3), "pob": p.get("POP_MAX") or 0,
                        "capital": cap})
    return out
