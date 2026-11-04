---
description: "Lee skillsusage.md, identifica la skill o secuencia adecuada para una tarea y sigue sus instrucciones."
name: "Elegir skill"
argument-hint: "Describe la tarea para la que quieres seleccionar una skill"
agent: "agent"
---

Para esta tarea: `$ARGUMENTS`

Este flujo también se puede invocar con `/elegir-skill`.

1. Lee [skillsusage.md](../../skillsusage.md) y selecciona la skill o secuencia que mejor corresponda a lo que pide el usuario.
2. Lee el `SKILL.md` de cada skill seleccionada en `../../.github/skills/<nombre>/SKILL.md`.
3. Antes de trabajar, indica brevemente los nombres de las skills elegidas y el motivo. Si ninguna aplica, dilo y no fuerces una.
4. Sigue el flujo de las skills durante la tarea. Si hace falta una decisión del usuario, pregunta antes de asumir.
5. Al terminar, resume qué pasos seguiste y qué verificaste. No afirmes verificaciones que no ejecutaste.
