# CLAUDE.md — boredom-killer

Leé `PLAN.md` antes de hacer nada. Es la fuente de verdad del alcance y las decisiones.

- Quien dirige el proyecto no lee código. Explicá decisiones en conceptos, en español rioplatense, sin elogios. Distinguí hecho, inferencia y supuesto.
- No hay Node en esta máquina. Python 3.13 para herramientas; la app es estática y sin compilación.
- Nada de IA en tiempo de ejecución salvo que `PLAN.md` lo diga.
- Tiene que andar en iPhone (Safari, táctil, offline) y en Edge de Windows. Rutas siempre relativas (`./`).
- Todo dato o código de terceros se anota en `CREDITOS.md` con su licencia. Nada GPL ni "compartir igual".
- Tokens: sin subagentes, sin releer archivos, sin reescribir archivos enteros para cambios chicos. La investigación web la corre el autor con prompts que le pasás.
- Verificación con evidencia (comando y salida, o la página de `pruebas/`). Un commit por paso verificado. No avanzar de paso sin OK.
- Si algo falla dos veces por lo mismo, frenar y diagnosticar.
