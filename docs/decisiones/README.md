# Decisiones de diseño y técnica

Notas cortas de por qué se hizo cada cosa de la forma en que se hizo. Lo vigente y completo está en [`PLAN.md`](../../PLAN.md).

## Todo el estado en un solo documento
Ajustes, partidas abiertas e historial viven en un único documento JSON (`app/nucleo/guardado.js`). Hace que exportar, importar y, más adelante, sincronizar sean la misma operación: pasar ese documento. La lógica no sabe dónde se guarda (recibe un "almacén"), así que se prueba contra memoria y funciona sobre IndexedDB. Un modo nunca ve el documento entero: solo su partida y su historial.

## Sin compilación, sin Node
HTML, CSS y módulos de JavaScript servidos tal cual. Cada archivo se puede abrir y leer; no hay paso que se rompa. Costo: no hay corredor de pruebas estándar, así que `pruebas/` corre las pruebas en el navegador con un corredor de 30 líneas.

## Uso offline con versión por contenido
El service worker guarda todos los archivos de `app/`. Su versión es un hash del contenido (`herramientas/generar_sw.py`): cualquier cambio en la app cambia `sw.js` y el navegador baja la versión nueva. La publicación automática falla si el hash quedó viejo. El hash ignora la diferencia de saltos de línea entre Windows y Linux.

## Mapas con proyección propia
Equirrectangular centrada (u = (lon − lon0)·cos(lat0), v = lat). Es plana, la inversa es exacta (hace falta para convertir un toque en coordenadas) y son unas 80 líneas, contra arrastrar d3-geo sin compilación. El puntaje es exponencial en los kilómetros de error, con una escala por lámina: 300 km pesa distinto en el mundo que en Nueva Zelanda.

## Palabra del día sin servidor
La palabra sale de un hash de la fecha local sobre la lista de respuestas: misma fecha, misma palabra, en cualquier dispositivo y sin red. La racha se calcula desde el historial, no se guarda aparte, así que no se desincroniza.

## Repetición espaciada: SM-2 propio
Cuarenta líneas, con pruebas. Lo que se marca "la sé" en la prueba de nivel no se descarta: vuelve a los 30 días para confirmar. Las tarjetas falladas se reintentan una vez en la misma sesión sin volver a tocar el calendario.

## Sin IA en tiempo de ejecución
La versión de hoy no llama a ningún modelo. Lo que Claude hizo fue escribir el código y revisar los datos, una vez. Los bancos de contenido generados y el puente con Claude solo en PC están en la lista de "después".

## Identidad en el repo público
Los commits y las licencias usan el usuario de GitHub, no un nombre personal; el email de autor es el de privacidad de GitHub. El prompt original no se publica; se publica una versión reescrita (`docs/origen/especificacion-inicial.md`).
