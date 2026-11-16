## Geografía

| Nombre | URL | Licencia | Tamaño | Para qué se usa |
| :--- | :--- | :--- | :--- | :--- |
| **@cublya/world-atlas** | https://www.jsdelivr.com/package/npm/@cublya/world-atlas | Build ISC; datos Natural Earth en dominio público | No verificado | Topología `countries-50m.json` (193 miembros ONU + 2 observadores) para mapas mudos, siluetas y países limítrofes. |
| **d3-geo / D3.js (módulo Geo)** (**coinciden**) | https://github.com/d3/d3-geo (Inf. 1) / https://github.com/d3/d3 (Inf. 2) | ISC | **A verificar:** no verificado (Inf. 1) vs. ~200 KB min.js módulo Geo / ~500 KB íntegra (Inf. 2) | Proyecciones esféricas y trazado de polígonos hacia SVG o Canvas 2D sin servidor de tiles. |
| **lipis/flag-icons** (**coinciden**) | https://github.com/lipis/flag-icons | **A verificar:** MIT atestiguada en derivado, LICENSE raíz no inspeccionado (Inf. 1) vs. MIT (Inf. 2) | **A verificar:** `country.json` 51,5 KB y carpeta SVG no verificada (Inf. 1) vs. 1,7 MB todo el repo (Inf. 2) | Banderas SVG (4x3 y 1x1) y `country.json` con códigos ISO y capitales (requiere traducir nombres al español). |

**Usar primero:** `@cublya/world-atlas` (`countries-50m.json`), `d3-geo` en bundle ESM/UMD y los SVG de `lipis/flag-icons` (evitando `geo-countries` de 14–14,6 MB y verificando licencia/estado de Georef-AR antes de incluir provincias argentinas).

## Inglés

| Nombre | URL | Licencia | Tamaño | Para qué se usa |
| :--- | :--- | :--- | :--- | :--- |
| **Tatoeba (pares EN–ES)** (**coinciden**) | https://tatoeba.org/es/downloads (Inf. 1) / https://tatoeba.org/en/downloads (Inf. 2) | CC BY 2.0 FR (Inf. 1 añade subconjunto CC0 1.0) | **A verificar:** 16,20 MB mazo EN–ES completo en texto (Inf. 1) vs. >10 MB CSV total (Inf. 2) | Pares de oraciones reales inglés-español con ID para atribución, filtrados offline a 2.000–4.000 frases cortas. |
| **olp-en-cefrj (CEFR-J + Octanove C1-C2)** | https://github.com/openlanguageprofiles/olp-en-cefrj | Uso gratuito para investigación y fines comerciales citando el dataset (sin SPDX explícito) | No verificado | Vocabulario graduado A1–C2 con categoría gramatical y acepciones para ejercicios tipo Cambridge y tarjetas. |
| **open-spaced-repetition/ts-fsrs** | https://github.com/open-spaced-repetition/ts-fsrs | MIT (Inf. 2 cita alternativa `squeakyRobot/fsrs` también MIT) | **A verificar:** no verificado en `ts-fsrs` (Inf. 1) vs. ~10 KB min.js en `squeakyRobot/fsrs` (Inf. 2) | Motor de repetición espaciada en JS (usar distribución ESM/UMD sin compilar y sin el binding Rust/WASI). |

**Usar primero:** `olp-en-cefrj`, un recorte JSON filtrado de `Tatoeba` (CC BY 2.0 FR), `ts-fsrs` (MIT) y `window.speechSynthesis` filtrando `localService === true` (sumando `open-dict-data/ipa-dict` solo carpeta `en_US` MIT para fonética y JSON propio para jerga neozelandesa/phrasal verbs).

## Contenido y datos

| Nombre | URL | Licencia | Tamaño | Para qué se usa |
| :--- | :--- | :--- | :--- | :--- |
| **words/an-array-of-spanish-words** | https://github.com/words/an-array-of-spanish-words | MIT | ~636.000 palabras (peso en MB no verificado) | Diccionario validador para Wordle en español, filtrando previamente offline solo palabras de 5 letras. |
| **Our World in Data (Chart Data API / CSV)** | https://ourworldindata.org/easier-to-reuse-our-data | CC BY (datos propios OWID; terceros conservan su licencia original) | Variable (muy chico al exportar un único corte anual por mapa) | Cortes anuales por país de indicadores globales para juegos de estimación numérica o Higher/Lower. |
| **codebox/mazes** | https://github.com/codebox/mazes | MIT | No verificado (clonar con `--recurse-submodules` por `mazejs`) | Generación procedural de laberintos y exportación SVG con o sin solución. |

**Usar primero:** Un JSON depurado de palabras de 5 letras desde `words/an-array-of-spanish-words` (MIT), `codebox/mazes` (MIT) y 10–15 cortes anuales de mapa de `Our World in Data` (verificando licencia de terceros en `.metadata.json`).

## Fondos y sonido

| Nombre | URL | Licencia | Tamaño | Para qué se usa |
| :--- | :--- | :--- | :--- | :--- |
| **KilledByAPixel/ZzFX** | https://github.com/KilledByAPixel/ZzFX | MIT | < 1 KB comprimido (`ZzFXMicro.min.js`) | Síntesis procedural de efectos sonoros con 20 parámetros sin archivos `.mp3`/`.wav` (envolver `AudioContext` al primer toque). |
| **23x2/generative-flow-field** | https://github.com/23x2/generative-flow-field | MIT | No verificado | Canvas WebGL 2 fijo de fondo (`z-index: -1`) con líneas fluidas y cambio de paletas vía `setConfig()`. |
| **Particular Drift** (**a verificar**) | https://github.com/collidingScopes/particular-drift (Inf. 1) / https://github.com/rafath/obrazki (fork, Inf. 2) | MIT | **A verificar:** no verificado (Inf. 1) vs. ~200 KB JS+shaders (Inf. 2) | Shaders GLSL de partículas y ruido Perlin/Simplex en WebGL 2 (alto consumo GPU en móviles). |

**Usar primero:** `KilledByAPixel/ZzFX` envuelto en un gestor perezoso con `GainNode` y `DynamicsCompressorNode`, junto con `23x2/generative-flow-field` con baja densidad de líneas y botón de pausa para iPhone.

## PWA en iPhone y guardado

| Nombre | URL | Licencia | Tamaño | Para qué se usa |
| :--- | :--- | :--- | :--- | :--- |
| **Service Worker manual (guía MDN)** (**coinciden**) | https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API/Using_Service_Workers | Estándar web (sin licencia de librería) | 0 KB (nativo) | Caché offline del app shell y datos estáticos sin compilación usando rutas relativas `./` para GitHub Pages. |
| **IndexedDB + respaldo JSON** (**coinciden**) | Estándar Web API (sin URL en informes) | Estándar web (nativo) | **A verificar:** cuota no cifrada (Inf. 1) vs. hasta ~500 MB o mitad de disco en iOS frente a ~5–10 MB en `localStorage` (Inf. 2) | Persistencia asíncrona de progreso y tarjetas FSRS, más exportación (`Blob`) e importación (`<input type="file">`) en JSON. |
| **GitHub Gist privado (BYOK) / BaaS (Supabase, Firebase)** (**coinciden**) | Sin URL en informes | **A verificar:** Supabase open-source; cuotas gratuitas y reglas de pausa no verificadas (Inf. 1) | 0 KB usando `fetch` nativo (sin SDK) | Sincronización opcional entre iPhone y PC con token pegado localmente por el usuario sin subir claves al repo público. |

**Usar primero:** `IndexedDB` (preferencias simples en `localStorage`), `Service Worker` manual con rutas `./` y botones visibles de exportar/importar partida JSON más aviso para agregar la app a Pantalla de Inicio en Safari.

## Proyectos parecidos

| Nombre | URL | Licencia | Tamaño | Para qué se usa |
| :--- | :--- | :--- | :--- | :--- |
| **ZLostTK/JavaScript-Games** | https://github.com/ZLostTK/JavaScript-Games | No verificada (solo referencia de arquitectura, no copiar código) | No verificado | Patrón de registro modular (`games/<nombre>/`, `games.json`), `EventBus` y adaptador unificado de teclado y toque. |
| **abagames/crisp-game-lib** | https://github.com/abagames/crisp-game-lib | No verificada (solo referencia de arquitectura, no copiar código) | No verificado | Shell único `index.html?[juego]` con carga dinámica sin compilación y controles táctiles minimalistas. |
| **Code-Institute-Submissions/Geography-game-2** | https://github.com/Code-Institute-Submissions/Geography-game-2 | No verificada (solo referencia de README, no copiar código) | No verificado | Estructura de README de portfolio con decisiones de diseño, breakpoints, testing, despliegue y atribución de licencias. |

**Usar primero:** Escribir desde cero una SPA en módulos ES nativos con registro declarativo de minijuegos (`mount(contenedor, contexto)` / `unmount()`), inyectando `IndexedDB`, `ZzFX` y `speechSynthesis` desde un contexto compartido.

## Riesgos y límites

* **Trampa GPL 3.0 en fonética y listas:** En `open-dict-data/ipa-dict`, el archivo `en_UK` está bajo GPL 3.0 (prohibido incluirlo si no se desea copyleft; usar solo `en_US` MIT). Asimismo, `ToolboxDay` (Inf. 2) es GPL-3.0+; usar `an-array-of-spanish-words` (MIT).
* **Contagio Compartir Igual (CC BY-SA):** Incluir `OpenEPD` (CC BY-SA 4.0), `data/dict.json` con homófonos de `english-to-ipa` (CC BY-SA 4.0), `LingvoBerry` (CC BY-SA 4.0, Inf. 2) o `frequency.csv` / `es-en.data` de `doozan/spanish_data` (CC BY-SA 3.0) exige licenciar derivados bajo Share-Alike; de ese repo usar solo `sentences.tsv` (CC BY 2.0 FR).
* **Licencias mixtas dentro de fuentes abiertas:** En `Our World in Data` (CC BY), los datos de terceros mantienen su licencia original (revisar `.metadata.json`) y su código `owid-grapher` exige permiso escrito; en `Tatoeba` (CC BY 2.0 FR), descartar audios por tener licencias mixtas o CC BY-NC.
* **Audio bloqueado y desvío al altavoz en iPhone:** Safari/WebKit descarta `AudioContext` y `speechSynthesis.speak()` fuera de un toque directo del usuario, y abrir el micrófono con `getUserMedia()` desvía forzadamente el audio de auriculares/AirPods al altavoz del iPhone (WebKit Bug 196539).
* **Borrado de almacenamiento a los 7 días en iOS (**a verificar**):** Safari exige instalación manual en Pantalla de Inicio (mantiene modo `standalone` fuera de la UE). Inf. 1 indica que agregar a Inicio aísla el contador frente al borrado de 7 días de WebKit (salvo presión extrema de disco o limpieza manual de historial), mientras Inf. 2 advierte purga tras ~7 días de inactividad.
* **Límite de caché en iOS y presupuesto de 30 MB (**a verificar**):** Guías externas reportan un tope de ~50 MB para Cache API en iOS (frente a cuota compartida por origen citada en Inf. 1). Subir `geo-countries` sin podar (14–14,6 MB) más `Tatoeba` completo (16,20 MB) rebasa los 30 MB totales.
* **Fallos de Service Worker en GitHub Pages y WebKit:** Las rutas absolutas (`/index.html`) rompen el caché en subrutas de proyecto; usar prefijo `./` en manifiesto y precaché, junto con versionado explícito de caché para evitar bugs de actualización en WebKit (Bugs 199110 y 190269).
* **Rendimiento GPU en iPhone y brechas sin dataset:** Shaders con partículas densas o extensiones flotantes (`particular-drift`) y escalado `devicePixelRatio` 3x degradan batería y fluidez en iOS; además, no hay datasets abiertos verificados para jerga neozelandesa, phrasal verbs ni trivia/poesía en español (requieren JSON propio).