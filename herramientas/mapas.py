"""Mapas: mundo, Argentina, Nueva Zelanda. Fuente: Natural Earth (dominio público).
Nombres en español de Natural Earth (NAME_ES); Falkland -> Islas Malvinas (toponimia oficial argentina)."""
from comun import NE, bajar, cargar_json, guardar, anillos, ciudades

print("mapas")
paises = cargar_json(bajar(NE + "ne_110m_admin_0_countries.geojson"))["features"]
lugares = cargar_json(bajar(NE + "ne_10m_populated_places.geojson"))["features"]
prov = cargar_json(bajar(NE + "ne_10m_admin_1_states_provinces.geojson"))["features"]
p50 = cargar_json(bajar(NE + "ne_50m_admin_0_countries.geojson"))["features"]


def nombre_pais(p):
    if p["ADM0_A3"] == "FLK":
        return "Islas Malvinas"
    return p.get("NAME_ES") or p["NAME"]


# Mundo
mundo = {"paises": [], "ciudades": []}
for f in paises:
    p = f["properties"]
    mundo["paises"].append({"id": p["ADM0_A3"], "nombre": nombre_pais(p),
                            "anillos": anillos(f["geometry"], 0.08, 0.02, 1)})
todas = sorted((f["properties"] for f in lugares), key=lambda p: -(p.get("POP_MAX") or 0))
vistos = set()
for i, p in enumerate(todas):
    cap = (p.get("FEATURECLA") or "") == "Admin-0 capital"
    if i < 80 or cap:
        n = p.get("NAME_ES") or p["NAME"]
        if n in vistos:
            continue
        vistos.add(n)
        mundo["ciudades"].append({"nombre": n, "pais": p["ADM0_A3"], "lon": round(p["LONGITUDE"], 2),
                                  "lat": round(p["LATITUDE"], 2), "capital": cap})
print(f"  mundo: {len(mundo['paises'])} países, {len(mundo['ciudades'])} ciudades")
guardar("mapa-mundo.json", mundo)


def caja_nz(anills):
    """True si el feature está en las islas principales de NZ (descarta islas subantárticas, Kermadec, Chatham, Tokelau)."""
    pts = [(r[i], r[i + 1]) for r in anills for i in range(0, len(r), 2)]
    if not pts:
        return False
    lon = sum(p[0] for p in pts) / len(pts)
    lat = sum(p[1] for p in pts) / len(pts)
    area = sum((max(r[0::2]) - min(r[0::2])) * (max(r[1::2]) - min(r[1::2])) for r in anills)
    return 166 < lon < 179.5 and -47.5 < lat < -34 and area > 0.05


def region(a3, n_ciudades, extra=None, es=True, filtro=None, excluir_ciudades=()):
    regs = []
    for f in prov:
        p = f["properties"]
        if p.get("adm0_a3") == a3:
            an = anillos(f["geometry"], 0.02, 0.004, 2)
            if filtro and not filtro(an):
                continue
            nombre = ((p.get("name_es") if es else None) or p["name"]).replace(" District", "").replace(" City", "")
            regs.append({"nombre": nombre, "anillos": an})
    for f in (extra or []):
        regs.append({"nombre": nombre_pais(f["properties"]),
                     "anillos": anillos(f["geometry"], 0.02, 0.004, 2)})
    # nombres repetidos (la Ciudad de Buenos Aires comparte nombre con la provincia): el más chico se renombra
    por_nombre = {}
    for r in regs:
        por_nombre.setdefault(r["nombre"], []).append(r)
    for nom, rs in por_nombre.items():
        if len(rs) > 1:
            rs.sort(key=lambda r: sum(len(a) for a in r["anillos"]))
            rs[0]["nombre"] = "Ciudad de " + nom if nom == "Buenos Aires" else nom + " (2)"
    return {"regiones": regs, "ciudades": ciudades(lugares, a3, n_ciudades, es, excluir_ciudades)}


malvinas = [f for f in p50 if f["properties"]["ADM0_A3"] == "FLK"]
configs = (("argentina", dict(a3="ARG", n_ciudades=30, extra=malvinas)),
           ("nueva-zelanda", dict(a3="NZL", n_ciudades=20, es=False, filtro=caja_nz,
                                  excluir_ciudades=("Manukau", "Waitakere", "North Shore City", "Waitangi", "North Shore"))))
for nombre, kw in configs:
    d = region(**kw)
    print(f"  {nombre}: {len(d['regiones'])} regiones, {len(d['ciudades'])} ciudades")
    guardar(f"mapa-{nombre}.json", d)
