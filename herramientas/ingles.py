"""Vocabulario inglés por nivel + oraciones inglés-español.
Vocabulario: CEFR-J Vocabulary Profile 1.5 (Tono Lab, TUFS), niveles A1-B2. Se deja afuera la lista
Octanove C1/C2 porque es CC BY-SA (compartir igual).
Oraciones: Tatoeba (CC BY 2.0 FR), pares eng-spa; se conservan id y autor para atribución."""
import bz2, csv, collections, re
from comun import bajar, guardar

print("ingles")
R = "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv"
vocab = []
with open(bajar(R), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        niv = r["CEFR"].strip()
        if niv in ("A1", "A2", "B1", "B2"):
            for h in r["headword"].split("/"):
                h = h.strip().lower()
                if h and re.fullmatch(r"[a-z' -]+", h):
                    vocab.append((h, r["pos"].strip(), niv))
vistos, v2 = set(), []
for h, pos, niv in vocab:
    if (h, pos) not in vistos:
        vistos.add((h, pos))
        v2.append([h, pos, niv])
por_nivel = collections.Counter(n for _, _, n in v2)
print(f"  vocabulario: {len(v2)} entradas {dict(por_nivel)}")

T = "https://downloads.tatoeba.org/exports/per_language/"
eng = {}
with bz2.open(bajar(T + "eng/eng_sentences_detailed.tsv.bz2"), "rt", encoding="utf-8") as f:
    for l in f:
        c = l.rstrip("\n").split("\t")
        if len(c) >= 4 and 20 <= len(c[2]) <= 80 and c[3] and c[3] != "\\N":
            eng[c[0]] = (c[2], c[3])
spa = {}
with bz2.open(bajar(T + "spa/spa_sentences_detailed.tsv.bz2"), "rt", encoding="utf-8") as f:
    for l in f:
        c = l.rstrip("\n").split("\t")
        if len(c) >= 4 and len(c[2]) <= 100 and c[3] and c[3] != "\\N":
            spa[c[0]] = (c[2], c[3])
pares = []
with bz2.open(bajar(T + "eng/eng-spa_links.tsv.bz2"), "rt", encoding="utf-8") as f:
    for l in f:
        a, b = l.split()[:2]
        if a in eng and b in spa:
            pares.append((a, b))
print(f"  pares eng-spa candidatos (20-80 car.): {len(pares)}")

indice = collections.defaultdict(list)
for a, b in sorted(set(pares)):
    for w in set(re.findall(r"[a-z']+", eng[a][0].lower())):
        indice[w].append((a, b))
usadas, salida = {}, []
for h, pos, niv in v2:
    if " " in h or "-" in h:
        continue
    cands = sorted(indice.get(h, []), key=lambda p: len(eng[p[0]][0]))[:2]
    ids = []
    for a, b in cands:
        if a in ids:
            continue  # una oración con dos traducciones: se queda con la primera
        usadas[a] = b
        ids.append(a)
    salida.append([h, pos, niv, ids])
oraciones = {a: [eng[a][0], spa[b][0], eng[a][1], spa[b][1], b] for a, b in usadas.items()}
sin = sum(1 for s in salida if not s[3])
print(f"  palabras: {len(salida)}, sin oración: {sin}, oraciones usadas: {len(oraciones)}")
guardar("ingles.json", {"vocabulario": salida, "oraciones": oraciones,
        "_nota": "vocabulario=[palabra,categoria,nivel,[ids]]; oraciones={id:[en,es,autor_en,autor_es,id_es]} (Tatoeba, CC BY 2.0 FR)"})
