# Boredom Killer

**Español** · [English](#english)

Modos cortos para pensar, jugar y aprender, para una sola persona. Es una página instalable que funciona **sin conexión** en iPhone (Safari, "Agregar a inicio") y en PC (Edge, Chrome). No hay servidor, cuentas ni IA en tiempo de ejecución: lo que hacés se guarda en tu dispositivo y podés exportarlo a un archivo.

**Probala:** https://bruneskycoder.github.io/boredom-killer/

Idea de diseño: *construcción antes que intensidad*. Cada modo termina, y lo que hacés se acumula. Nada de scroll infinito ni logros inflados.

## Qué trae hoy

| Modo | Qué es |
|---|---|
| **Palabra de campo** | Una palabra de cinco letras por día, seis intentos, racha de días ganados. Las tildes dan igual. Si cerrás a la mitad, retomás. Se puede practicar con otras palabras. |
| **Dónde queda** | Mapa mudo con tres láminas (mundo, Argentina, Nueva Zelanda). Tocás dónde queda el lugar; el puntaje sale de los kilómetros de error. Rondas de 10, con zoom y arrastre táctil. |
| **Silueta** | La forma de un país y cuatro nombres para elegir. Diez por ronda, con teclado (1 a 4) y toque. |
| **Inglés** | Prueba de nivel de 30 palabras que ubica tu mazo; tarjetas con una oración real de Tatoeba y su traducción, con repaso espaciado (SM-2) y voz del dispositivo; dictado. |

Interfaz en español rioplatense e inglés. Lobby con teclado (↑ ↓ Enter Esc) y toque. Sonidos de guitarra criolla sintetizados con código propio; fondo animado en canvas.

## Correrlo en tu máquina

Hace falta Python 3 (solo para servir los archivos; la app no se compila).

```bash
python herramientas/servidor.py          # http://localhost:8000/app/
python herramientas/servidor.py --red    # también para el celular, misma wifi (sin uso offline: eso pide https)
```

- **Pruebas:** abrí `http://localhost:8000/pruebas/`. Corren en el navegador y deben dar todo en verde.
- **Después de tocar `app/`:** `python herramientas/generar_sw.py`. Regenera la lista de archivos y la versión del uso offline (el repo se niega a publicar si quedó vieja).

## Cómo está armado

```
app/         lo único que se publica (HTML, CSS y módulos JS servidos tal cual)
  nucleo/    lobby, navegación, guardado, idiomas, sonido, fondo, voz
  modos/     un modo por carpeta; se suma con su carpeta y una línea en registro.js
  datos/     JSON ya recortados (palabras, mapas, vocabulario)
herramientas/ Python: bajan y recortan los datos, servidor local, íconos, versión offline
pruebas/     las pruebas de la lógica
docs/        investigación, decisiones, origen del proyecto y la "semilla" de prototipos
```

Un modo es un objeto con `id`, `familia`, `minutos`, `textos`, `montar(contenedor, ctx)` y `desmontar()`. El `ctx` trae el guardado del modo, sonido, fondo, voz y `salir()`. Los textos de cada modo viven en su `textos.js`, en los dos idiomas. El plan completo está en [`PLAN.md`](PLAN.md).

## Datos y créditos

Países, provincias y ciudades: [Natural Earth](https://www.naturalearthdata.com) (dominio público). Lista de palabras: `words/an-array-of-spanish-words` (MIT). Oraciones: [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR). Vocabulario: CEFR-J. Tipografías Literata e IBM Plex Mono (SIL OFL). Detalle y licencias en [`CREDITOS.md`](CREDITOS.md).

## Licencias

Código: [MIT](LICENSE). Textos de la interfaz, documentación e íconos: [CC BY 4.0](LICENSE-CONTENIDO). Datos y tipografías de terceros conservan su licencia.

## Origen

Empezó como un prompt para un asistente de código ([versión reescrita](docs/origen/especificacion-inicial.md)) y unos prototipos de una página ([la semilla](docs/semilla/LEEME.md)). El camino de ahí al producto está en `PLAN.md` y `docs/`.

---

<a id="english"></a>

# Boredom Killer (English)

Short modes for thinking, playing and learning, for one person. It's an installable web page that works **offline** on iPhone (Safari, "Add to Home Screen") and on desktop (Edge, Chrome). There is no server, no accounts and no AI at runtime: what you do is saved on your device and you can export it to a file.

**Try it:** https://bruneskycoder.github.io/boredom-killer/

Design idea: *building over intensity*. Every mode ends, and what you do accumulates. No infinite scroll, no inflated achievements.

## What it has today

| Mode | What it is |
|---|---|
| **Field Word** | One five-letter Spanish word a day, six tries, a streak of days won. Accents don't matter. Close it halfway and you resume. You can practise with other words. |
| **Where Is It** | Blank map with three plates (world, Argentina, New Zealand). Tap where the place is; the score comes from the kilometres of error. Rounds of 10, with touch zoom and drag. |
| **Silhouette** | The shape of a country and four names to pick from. Ten per round, keyboard (1 to 4) and touch. |
| **English** | A 30-word level test that places your deck; cards with a real Tatoeba sentence and its translation, spaced repetition (SM-2) and the device voice; dictation. |

Interface in Rioplatense Spanish and English. Lobby with keyboard (↑ ↓ Enter Esc) and touch. Classical-guitar sounds synthesised with original code; animated canvas background.

## Run it locally

You need Python 3 (only to serve the files; there is no build step).

```bash
python herramientas/servidor.py          # http://localhost:8000/app/
python herramientas/servidor.py --red    # also for your phone, same wifi (no offline use: that needs https)
```

- **Tests:** open `http://localhost:8000/pruebas/`. They run in the browser and should all be green.
- **After changing `app/`:** `python herramientas/generar_sw.py`. It regenerates the offline file list and version (CI refuses to publish a stale one).

## Structure

See the tree above. A mode is an object with `id`, `familia`, `minutos`, `textos`, `montar(container, ctx)` and `desmontar()`; adding one means adding its folder and one line in `registro.js`. The full plan is in [`PLAN.md`](PLAN.md) (Spanish).

## Data, credits and licenses

Countries, provinces and cities: [Natural Earth](https://www.naturalearthdata.com) (public domain). Word list: `words/an-array-of-spanish-words` (MIT). Sentences: [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR). Vocabulary: CEFR-J. Fonts Literata and IBM Plex Mono (SIL OFL). Details in [`CREDITOS.md`](CREDITOS.md). Code: [MIT](LICENSE). UI text, docs and icons: [CC BY 4.0](LICENSE-CONTENIDO). Third-party data and fonts keep their own licenses.
