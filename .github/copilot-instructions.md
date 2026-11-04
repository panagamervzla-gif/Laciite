# Selección automática de skills

Antes de atender cada nueva tarea del usuario en este workspace, consulta [skillsusage.md](../skillsusage.md) y deduce qué skill o combinación de skills corresponde. Si una aplica, lee su `SKILL.md` en `.github/skills/<nombre>/SKILL.md` y sigue su flujo; no te limites a mencionar el comando.

Al comenzar una tarea de trabajo, indica brevemente `Skill seleccionada: /<nombre> — <motivo>`. Si no aplica ninguna, dilo brevemente y continúa sin forzar una skill. Para tareas con varias fases, selecciona las skills pertinentes en el orden necesario. Si una skill requiere una decisión del usuario, detente y pregunta antes de asumir. Al terminar, resume qué pasos de la skill seguiste y qué verificaste; no afirmes haber hecho pasos que omitiste.

El usuario puede corregir la selección o pedir otra skill en cualquier momento. Prioriza esa indicación, vuelve a consultar su `SKILL.md` y ajusta el flujo. Para seleccionar manualmente una skill de la tarea actual, también está disponible `/elegir-skill`.

Antes de continuar una tarea en este workspace, consulta también la [guía de continuidad para agentes](../docs/AI-HANDOFF.md) y aplica las secciones pertinentes. Es una guía operativa enlazada, no reemplaza los `SKILL.md` ni las instrucciones de este archivo.

## Organización del repositorio

Antes de crear, reubicar o reorganizar archivos, lee y sigue [docs/ORGANIZATION.md](../docs/ORGANIZATION.md). Usa sus carpetas funcionales existentes, conserva las ubicaciones exigidas por Vite/Vercel y actualiza imports y documentación al mover archivos. Si una responsabilidad no encaja claramente, revisa el mapa de arquitectura y pregunta antes de inventar una nueva carpeta o duplicar lógica.

## Documentación interna de operaciones del IDE

Al añadir, cambiar o retirar una operación que el usuario pueda ejecutar en la interfaz, crea o actualiza su página individual `function-<slug>.md` en `.local/function-docs/`. Una operación es una tarea de usuario independiente, no un botón auxiliar, evento técnico o función interna.

Cada página debe explicar propósito, ubicación exacta en la interfaz, requisitos, pasos, resultado esperado, límites o precauciones, acciones relacionadas, estado y fecha/tipo de verificación. Si una operación depende de una herramienta externa, aclara qué cubre Laccite y enlaza la documentación oficial externa para el resto. Al retirar una operación, conserva su página y márcala como `Retirada`; no la borres. Actualiza también `.local/function-docs/README.md` con el nombre, estado y conteo de páginas vigentes y retiradas. Mantén esta carpeta excluida de Git: es material privado de preparación y no forma parte del producto ni de la documentación pública.
