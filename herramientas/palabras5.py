"""Palabras de 5 letras del español para Palabra de campo.
Fuente: words/an-array-of-spanish-words (MIT). Frecuencia: oraciones en español de Tatoeba (CC BY 2.0 FR).
Salida: app/datos/palabras5.json  {validas:[...], respuestas:[...]}
Sin tildes (la ñ se conserva): con o sin tilde es la misma palabra para el juego.
Respuestas: comunes, sin nombres propios y sin formas conjugadas (los infinitivos sí)."""
import bz2, collections, re, sys, unicodedata
from comun import bajar, cargar_json, guardar


def sin_tildes(w):
    w = w.replace("ñ", "\0")
    w = unicodedata.normalize("NFD", w)
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return w.replace("\0", "ñ")


print("palabras5")
lista = cargar_json(bajar("https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.json", "palabras-es.json"))
todas = {sin_tildes(w.lower().strip()) for w in lista}   # diccionario completo, para buscar infinitivos
validas = {w for w in todas if re.fullmatch(r"[a-zñ]{5}", w)}
infinitivos = {w for w in todas if re.fullmatch(r"[a-zñ]{3,}(ar|er|ir)", w)}
print(f"  validas: {len(validas)}")

# Terminaciones de formas conjugadas (presente, imperfecto, pretérito, subjuntivo, voseo)
TERMINACIONES = ["o", "a", "e", "as", "es", "an", "en", "amos", "emos", "imos", "ais", "eis", "is",
                 "aba", "abas", "aban", "ia", "ias", "ian", "io", "ieron", "aron", "ad", "ed", "id"]
# Cambios de raíz: puede->poder, piensa->pensar, pide->pedir, juega->jugar, siente->sentir, etc.
CAMBIOS = [("ue", "o"), ("ie", "e"), ("i", "e"), ("ui", "u"), ("ig", "ec"), ("ng", "n"), ("zc", "c"),
           ("g", "c"), ("gu", "g"), ("qu", "c"), ("c", "z"), ("j", "g"), ("y", "")]


def es_conjugacion(w, frec):
    if w.endswith(("ar", "er", "ir")):
        return False  # infinitivo: se queda
    for t in TERMINACIONES:
        if w.endswith(t) and len(w) - len(t) >= 2:
            raiz = w[:-len(t)]
            raices = {raiz}
            for a, b in CAMBIOS:
                if a in raiz:
                    raices.add(raiz.replace(a, b, 1))
                if b and b in raiz:
                    raices.add(raiz.replace(b, a, 1))
            for r in raices:
                for inf in ("ar", "er", "ir"):
                    # el infinitivo tiene que existir y usarse al menos tanto como la palabra:
                    # así "libro" (libro, no "librar") o "campo" se quedan, y "canta" (cantar) se va
                    if r + inf in infinitivos and frec[r + inf] >= 0.7 * frec[w]:
                        return True
    return False


# Irregulares y formas cortas que la regla no alcanza
IRREGULARES = set("""estoy estan estas esten estes somos hemos vamos vayan vayas hayan hayas habia habra haran haria
tengo tenga tenia tendra sabra sepan sepas seran seras seria seais sirve vengo venga venia veian veras viera
fuese fuera haced hagan hagas haces hacen digan digas dicen dices diste dimos diera quise quiso trajo traje traen
traes traia pongo ponga ponen pones ponia salgo salga salia puedo pueda puede podia podra podre podes decis
tenes venis vivis dejad mirad venid sigue sigas siento sintio
acaba acabo acuso adora adoro agoto ahogo alejo amaba apoyo apuro ataco atrae caben cansa canse canso causo corri
creci crees daban damos dando daria debes deben desea diras diria dormi duele elija exige fluye gusta guste halla
haras huele lanzo llamo logro mando metio movio murio nacio ocupa odian opina opino pateo perdi pidio posee queda
quedo quejo quema quemo quito rompi segui senti sopla soplo suele suena trata usaba valen vemos vendi vimos viste
volvi yendo habre oimos oiste tiene juega rodea cubre lleva lanza tarda colgo solia valia verse verte""".split())

# Palabras comunes que la regla confunde con conjugaciones (sustantivos), o que no queremos como respuesta
CONSERVAR = set("""citas agudo firma firme gases genio gorra gorro justa luces lucha mates pared pares penas plaza plazo
prima primo sabio solas talla tenis terco toque zorro salto pesca pinta gasto grito corte hacia fuera frias duras
cerro canto vuelo trato""".split())
BLOQUEO = {"joder", "pedos", "hobby", "pizza", "super", "extra", "judio", "sueco", "checo", "turco", "vasco", "negra", "negro"}

ruta = bajar("https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences.tsv.bz2")
frec = collections.Counter()    # apariciones, con o sin tilde
mayus = collections.Counter()   # apariciones con mayúscula en medio de la oración (nombres propios)
with bz2.open(ruta, "rt", encoding="utf-8") as f:
    for linea in f:
        texto = linea.rstrip("\n").split("\t")[2]
        for i, tok in enumerate(re.findall(r"[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+", texto)):
            n = sin_tildes(tok.lower())
            frec[n] += 1
            if i > 0 and tok[0].isupper():
                mayus[n] += 1

comunes = [w for w in validas
           if frec[w] >= 25 and mayus[w] <= 0.2 * frec[w] and w not in BLOQUEO]
conj = sorted(w for w in comunes if w not in CONSERVAR and (w in IRREGULARES or es_conjugacion(w, frec)))
respuestas = sorted(set(comunes) - set(conj))
print(f"  comunes: {len(comunes)}, conjugaciones sacadas: {len(conj)}, respuestas: {len(respuestas)}")
if "--ver" in sys.argv:
    print("SACADAS:", " ".join(conj))
    print("QUEDAN:", " ".join(respuestas))
guardar("palabras5.json", {"validas": sorted(validas), "respuestas": respuestas})
