# Créditos de datos y código de terceros

Los datos se generan con los scripts de `herramientas/` (ver cada uno). Lo bajado crudo queda fuera del repo (`herramientas/crudo/`); en `app/datos/` queda solo el recorte.

| Dato | Fuente | Licencia | Se usa en | Script |
|---|---|---|---|---|
| Lista de palabras en español | [words/an-array-of-spanish-words](https://github.com/words/an-array-of-spanish-words) | MIT | Palabra de campo (`palabras5.json`) | `palabras5.py` |
| Frecuencia de palabras (para elegir respuestas) | [Tatoeba](https://tatoeba.org), oraciones en español | CC BY 2.0 FR | Palabra de campo | `palabras5.py` |
| Países, provincias y ciudades (forma y nombres en español) | [Natural Earth](https://www.naturalearthdata.com) | Dominio público | Dónde queda (`mapa-*.json`) | `mapas.py` |
| Vocabulario inglés A1–B2 | [CEFR-J Vocabulary Profile 1.5](https://github.com/openlanguageprofiles/olp-en-cefrj), Tono Laboratory, Tokyo University of Foreign Studies (Tono, Y., compilador) | Uso gratuito, también comercial, citando el dataset; sin texto formal de licencia | Inglés (`ingles.json`) | `ingles.py` |
| Oraciones inglés–español (con id y autor) | [Tatoeba](https://tatoeba.org) | CC BY 2.0 FR | Inglés | `ingles.py` |

## Tipografías

Se copian al repo sin modificar, cada uno con el texto de su licencia al lado.

| Qué | Fuente | Licencia | Se usa en | Dónde queda |
|---|---|---|---|---|
| Literata (redonda y cursiva, pesos 400 a 700, recorte latino) | [The Literata Project Authors](https://github.com/googlefonts/literata), vía Google Fonts | SIL OFL 1.1 | Texto de lectura | `app/estilos/fuentes/` |
| IBM Plex Mono (400 y 600, recorte latino) | IBM Corp., vía Google Fonts | SIL OFL 1.1 | Etiquetas, botones, marcadores | `app/estilos/fuentes/` |

Notas:
- La OFL permite incluir y redistribuir las fuentes; solo obliga a que una versión modificada de la fuente misma siga siendo OFL. No alcanza al código ni al contenido.
- Natural Earth muestra las Islas Malvinas con nombre en inglés; en `mapas.py` se renombran "Islas Malvinas" (toponimia oficial argentina).
- Se descartó la lista Octanove C1/C2 del mismo repositorio de CEFR-J porque es CC BY-SA ("compartir igual").
- Las oraciones de Tatoeba conservan el id y el autor para poder atribuir cada una.
- `nz-printable-atlas` (MIT, del propio autor) se revisó: sus regiones vienen de Stats NZ/LINZ con otras licencias y 386 KB de peso, así que para Nueva Zelanda se usó Natural Earth.
