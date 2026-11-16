# Especificación inicial (reescrita)

El proyecto empezó como un prompt largo para un asistente de código. Esta es su versión reescrita sin datos personales; el original no se publica. Muestra de dónde se partió y qué cambió después (ver `PLAN.md` para lo vigente).

## El problema

Cuando alguien está aburrido de noche quiere algo que le estimule la cabeza y los ojos sin tener que decidir mucho ni salir a buscarlo.

## El producto que se pidió

Una app local de escritorio, a pantalla completa, con muchos modos cortos para pensar, jugar, crear y mirar. Varios modos usarían a Claude como contrincante, narrador o lector, todo con fondo visual vivo y sonido. Una sola persona, sesiones de 10 minutos a 2 horas, teclado y mouse.

Criterios de éxito: abrir con doble clic y ver el lobby en menos de 5 segundos; llegar a cualquier modo en dos acciones; que todo quede guardado; fondos fluidos que no tapan la lectura; que los modos sin IA sigan andando si Claude no responde.

## Cómo se quería trabajar

Quien dirige no programa: especifica y comprueba. Planificar antes de escribir código, un commit por paso verificado, explicar las decisiones en conceptos, cuidar los tokens y frenar a diagnosticar si algo falla dos veces por lo mismo.

## Decisiones iniciales

| Tema | Decisión inicial | Qué pasó |
|---|---|---|
| Forma | Web local: servidor chico + página | Cambió: página estática instalable (PWA), para que ande también en el iPhone y sin conexión |
| IA | El servidor llama a `claude -p` | Cambió: ninguna IA en tiempo de ejecución en la versión de hoy |
| Construcción | Sin compilación: HTML, CSS y módulos JS | Se mantuvo |
| Datos | Archivos en una carpeta | Cambió: IndexedDB con exportar e importar un JSON |
| Red | Solo `127.0.0.1` | Ya no aplica: se publica una página estática |
| Versionado | Git local; GitHub lo decide el autor | Se publica como repo `boredom-killer` |

## Fuera de alcance entonces

Multiusuario, cuentas, nube, versión móvil, generación de imágenes. Dos de ellos (nube y móvil) cambiaron: hoy es una página publicada pensada primero para el celular y la PC.
