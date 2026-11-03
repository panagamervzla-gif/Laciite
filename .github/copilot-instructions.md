# Selección automática de skills

Antes de atender cada nueva tarea del usuario en este workspace, consulta [skillsusage.md](../skillsusage.md) y deduce qué skill o combinación de skills corresponde. Si una aplica, lee su `SKILL.md` en `.github/skills/<nombre>/SKILL.md` y sigue su flujo; no te limites a mencionar el comando.

Al comenzar una tarea de trabajo, indica brevemente `Skill seleccionada: /<nombre> — <motivo>`. Si no aplica ninguna, dilo brevemente y continúa sin forzar una skill. Para tareas con varias fases, selecciona las skills pertinentes en el orden necesario. Si una skill requiere una decisión del usuario, detente y pregunta antes de asumir. Al terminar, resume qué pasos de la skill seguiste y qué verificaste; no afirmes haber hecho pasos que omitiste.

El usuario puede corregir la selección o pedir otra skill en cualquier momento. Prioriza esa indicación, vuelve a consultar su `SKILL.md` y ajusta el flujo. Para seleccionar manualmente una skill de la tarea actual, también está disponible `/elegir-skill`.

## Organización del repositorio

Antes de crear, reubicar o reorganizar archivos, lee y sigue [docs/ORGANIZATION.md](../docs/ORGANIZATION.md). Usa sus carpetas funcionales existentes, conserva las ubicaciones exigidas por Vite/Vercel y actualiza imports y documentación al mover archivos. Si una responsabilidad no encaja claramente, revisa el mapa de arquitectura y pregunta antes de inventar una nueva carpeta o duplicar lógica.
