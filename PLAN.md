# PLAN — boredom-killer (Sobremesa)

Estado: pasos 1 a 6 hechos, más Carnet, "Elegí por mí" y el modo Silueta (de la lista "Después de hoy"). Falta crear el repo en GitHub y publicar (necesita repo creado y token con permisos). Los textos de cada modo viven en `modos/<id>/textos.js`; un modo puede sumar `carnet()` para aparecer en el Carnet. Tras tocar `app/`, correr `python herramientas/generar_sw.py`.
Última actualización: 2026-11-15.

## 1. Qué es

Una colección de modos cortos para pensar, jugar y aprender, pensada para una sola persona. Es una página instalable que funciona offline en iPhone (Safari, agregada a inicio) y en PC (Edge). Se publica en GitHub Pages como repo público `boredom-killer`. La app se llama Boredom Killer ("Sobremesa" fue el nombre de trabajo).

Principio de diseño: **construcción antes que intensidad**. Cada modo termina, y lo que se hace se acumula (vocabulario, marcas, mapa de lo que ya se sabe). Nada de scroll infinito ni logros inflados.

## 2. Decisiones

Reemplazan a las del prompt original (`docs/origen/prompt-original.md`) donde se contradicen.

| Tema | Decisión | Por qué |
|---|---|---|
| Forma | Página estática instalable (PWA), sin servidor | Tiene que andar offline en el iPhone |
| Construcción | Sin compilación: HTML, CSS y módulos de JavaScript servidos tal cual | No hay Node en la PC y no hace falta |
| IA | Ninguna en tiempo de ejecución en la versión de hoy. Después: bancos de contenido generados una vez, y Claude en vivo solo en la PC para pocos modos | No gastar tokens al usar la app |
| Guardado | En el navegador (IndexedDB), con exportar e importar a un archivo JSON | En el iPhone no hay carpeta de archivos; el export cubre el riesgo de que Safari borre datos |
| Sincronización | No hoy. El guardado vive en una sola pieza para poder sumarla después | Evita cuentas y servicios externos ahora |
| Mapas | Proyección y dibujo propios en canvas (unas 100 líneas); los datos se recortan antes con Python | d3-geo sin compilación arrastra dependencias; el mapa mudo no las necesita |
| Repetición espaciada | Algoritmo SM-2 propio, con pruebas | ts-fsrs no está verificado sin compilación; SM-2 alcanza y son 40 líneas |
| Fondo | Campo de flujo propio en Canvas 2D, a baja resolución y escalado | Los repos de shaders del resumen no están verificados y son caros en iPhone |
| Sonido | Guitarra criolla sintetizada con código propio: cuerda pulsada (Karplus-Strong) y golpe en la caja. Reemplaza a ZzFX | Sin archivos de audio. ZzFX sonaba a arcade viejo y el autor pidió guitarra criolla (paso 2a) |
| Datos | Scripts de Python bajan y recortan cada dataset una sola vez; el resultado queda en el repo | Reproducible, sin internet al usar la app, y muestra de dónde sale cada dato |
| Pruebas | Una página `pruebas/` que corre las pruebas de la lógica en el navegador | Sin Node no hay otro corredor; además se puede abrir y ver en verde |
| Publicación | GitHub Actions publica solo la carpeta `app/` | El resto del repo (docs, herramientas) no se sirve |
| Licencias | Código MIT. Contenido propio CC BY 4.0. Datos de terceros con su licencia, listados en `CREDITOS.md` | Obliga a nombrarte; no restringe más |
| Idioma | Interfaz en español rioplatense e inglés, con selector. Cada texto vive en un archivo de textos por modo, nunca suelto en el código. El contenido que es de un idioma (Palabra de campo) no se traduce. README en los dos idiomas | Práctica de inglés y portfolio legible afuera |
| Estética | Mezcla de enciclopedia y arcade: lámina de atlas y tipografía de lectura para el contenido, negro, líneas finas y color saturado puntual para el juego. Se aprueba mirando una página de muestra (paso 2) antes de construir modos | Elegida por el autor; la semilla aporta el tono oscuro y las etiquetas monoespaciadas |
| Reglas de diseño | Aprobadas en `muestra/`: lo que se lee va en papel y lo que se juega en negro; el contenido en serif (Literata) y la app en monoespaciada (IBM Plex Mono), las dos incluidas en el repo (OFL, 110 KB); bermellón como único color de marca; acierto verde lleno, casi ámbar en contorno, fallo apagado sin rojo; un color por familia. Los valores viven en `app/estilos/base.css` | Se ve igual en iPhone y Edge; fallar no castiga |
| Familias | Pensar, Jugar, Crear, Mirar, Aprender. Inglés y geografía van en Aprender | — |
| Origen y semilla | Se publican: el prompt original reescrito sin datos personales (`docs/origen/especificacion-inicial.md`) y la semilla en `docs/semilla/` con una nota de qué era | Muestran el camino de especificación a producto |
| Nombres en mapas | Toponimia oficial argentina en español (Islas Malvinas) | — |

Excluido a propósito: GPL y "compartir igual" (`ipa-dict en_UK`, OpenEPD, `doozan/spanish_data` salvo oraciones), audios de Tatoeba, reconocimiento de voz, ajedrez, IA local.

## 3. Estructura de carpetas

```
app/                    lo único que se publica
  index.html
  manifest.json
  sw.js                 uso offline; lista de archivos con versión
  nucleo/               lobby, navegación, guardado, sonido, fondo, voz
  modos/
    registro.js         lista de modos (una línea por modo)
    palabra/ donde-queda/ ingles/
  datos/                JSON ya recortados
  estilos/              base.css y fuentes/ (Literata, IBM Plex Mono)
herramientas/           Python: bajar y recortar datos, servidor local de prueba (servidor.py)
muestra/                página de muestra de diseño (paso 2a); no se publica
pruebas/                página que corre las pruebas
docs/
  investigacion/        resumen.md (y completo/ para los informes enteros)
  decisiones/           una nota corta por decisión importante
  origen/               prompt original (fuera de git hasta que digas)
semilla/                los ocho prototipos, como referencia
PLAN.md  README.md  CREDITOS.md  LICENSE  LICENSE-CONTENIDO  CLAUDE.md
```

## 4. Contrato de modo

Cada modo es una carpeta con un archivo que declara qué es y dos funciones. La app le pasa un "contexto" con todo lo compartido; el modo no toca nada más.

```js
export default {
  id: 'palabra',
  nombre: 'Palabra de campo',
  familia: 'jugar',            // pensar | jugar | crear | mirar | aprender
  linea: 'Cinco letras, seis intentos.',
  minutos: 5,
  usaIA: false,
  montar(contenedor, ctx) { /* dibuja y arranca */ },
  desmontar() { /* limpia */ },
};
```

`ctx` trae:
- `guardado`: leer y escribir la partida abierta del modo, y anotar un resultado cerrado en el historial.
- `sonido`: acierto, error, turno, fin.
- `fondo`: fijar tensión (0 a 1) y tono.
- `voz`: decir un texto en inglés con una voz del dispositivo.
- `salir()`: volver al lobby.

Agregar un modo es sumar su carpeta y una línea en `registro.js`. (Sin servidor, la página no puede descubrir carpetas sola.)

## 5. Alcance de hoy

| # | Paso | Se da por hecho cuando | Modelo / effort |
|---|---|---|---|
| 1 | **Datos.** Scripts que generan: palabras de 5 letras del español; mapa mundial simplificado con países y ciudades con nombre en español (Natural Earth, dominio público); Argentina (provincias y ciudades) y Nueva Zelanda (regiones y ciudades; mirar primero qué datos ya usa `bruneskycoder/nz-printable-atlas`); vocabulario inglés por nivel (CEFR-J) con oraciones inglés–español (Tatoeba) | Cada script imprime cantidad de registros y peso; total bajo 10 MB | Sonnet, medium |
| 2a | **Muestra de diseño.** Una sola página con paleta, tipografías, botones, tarjetas, una lámina de mapa, el fondo en sus tres intensidades y los cuatro sonidos | El autor la mira en PC e iPhone y aprueba o pide cambios. Nada más se construye antes | Opus o Fable, high (es la decisión de gusto; sesión corta) |
| 2b | **Esqueleto.** Lobby con teclado y toque, navegación, selector de idioma, guardado con exportar/importar, sonido, fondo, uso offline, aviso de "agregar a inicio" | Abre en la PC, se recarga sin red y sigue andando; pruebas del guardado en verde | Sonnet, medium |
| 3 | **Palabra de campo.** Portada de la semilla: palabra del día, racha, validación contra la lista | Pruebas del puntaje con letras repetidas en verde; partida retomable | Sonnet, low |
| 4 | **Dónde queda.** Mapa mudo con tres láminas (mundo, Argentina, Nueva Zelanda); tocás dónde está el lugar; puntaje por kilómetros de error; ronda de 10 | Pruebas de distancia y proyección en verde; zoom y toque usables en pantalla chica | Sonnet, medium |
| 5 | **Publicar.** README en dos idiomas con capturas, licencias, créditos, origen y semilla, publicación automática, repo en GitHub | La dirección de Pages abre en el iPhone, se instala y anda en modo avión | Sonnet, medium |
| 6 | **Inglés v1.** Prueba de nivel de 30 palabras que ubica el mazo; tarjetas con repetición espaciada (palabra, nivel, oración real con traducción, voz); dictado | Pruebas del algoritmo y de la prueba de nivel en verde; las tarjetas vencidas vuelven el día que corresponde | Sonnet, medium |

Con interfaz en dos idiomas, tres láminas de mapa y prueba de nivel, es probable que no entre todo en un día. Por eso publicar va antes que inglés: lo que quede hecho hoy ya está en el iPhone, e inglés se suma como actualización.

Cada paso cierra con commit y una lista de 3 a 7 cosas para que pruebes a mano. Entre pasos conviene `/clear`; este archivo alcanza para retomar.

## 6. Después de hoy (orden propuesto)

1. Carnet (historial, rachas, tiempo) y "elegí por mí".
2. Geografía: silueta, frontera a frontera, sprint de banderas, a ojo (estimación con calibración).
3. Inglés: pares mínimos, huecos, phrasal verbs y jerga de Nueva Zelanda (JSON propio), glosas en español.
4. Sin IA: Vida, Visualizador, Madriguera, Cronología, Fermi con datos de Our World in Data.
5. Bancos horneados con Claude (trivia, cazafalacias, dilemas).
6. Puente con Claude solo en PC: veinte preguntas, abogado del diablo, devolución de escritura, rol en inglés.
7. Sincronización entre iPhone y PC.

## 7. Riesgos y qué hago con cada uno

| Riesgo | Manejo |
|---|---|
| `@cublya/world-atlas` del resumen no me consta que exista | Uso Natural Earth directo o `topojson/world-atlas` (ISC); verifico al bajar |
| Safari puede borrar datos guardados (los informes se contradicen) | Exportar visible desde el día uno; recordatorio si pasó mucho sin exportar |
| El audio y la voz en iPhone solo arrancan tras un toque | El sonido se activa con el primer toque en el lobby |
| Las voces en inglés dependen del teléfono | Se listan las disponibles y se elige; si no hay ninguna, el dictado lo avisa |
| El vocabulario CEFR-J no trae traducción | Hoy el significado sale de la oración traducida; las glosas se suman después |
| Licencia de CEFR-J sin texto formal | Se cita como pide el dataset; si al leerla hay dudas, se reemplaza por otra lista |
| Rutas rotas en GitHub Pages | Todas las rutas relativas (`./`) y versión explícita del caché |
| Fondo pesado en iPhone | Resolución reducida, pausa cuando no está visible, posición "calmo" casi quieta |

## 8. Diseño: cuándo se decide cada cosa

| Qué | Cuándo | Cómo lo aprobás |
|---|---|---|
| Colores, tipografías, componentes, fondo base, sonidos base | Paso 2a | Mirando la página de muestra en PC e iPhone |
| Transiciones y animaciones de navegación | Paso 2b | Usando el lobby |
| Lo propio de cada modo (cómo reacciona el fondo, sonidos particulares) | Al cerrar cada modo | En la lista de prueba del modo |
| Pulido fino (ritmo, detalles, fondos por familia) | Después de publicar, con la app en uso | Tanda aparte |
