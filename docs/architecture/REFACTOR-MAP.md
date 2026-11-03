# Capability Map: refactor de la aplicación Studio

## Objetivo

Separar gradualmente las responsabilidades concentradas en `studio/src/app/main.ts` para que los cambios futuros sean más localizados y seguros, sin cambiar el comportamiento intencional de la aplicación.

## Mapa de módulos

| Module id | Responsabilidad | Depende de |
|---|---|---|
| `project-context` | Mantener el estado compartido del proyecto activo (datos, selección y contexto necesario para las vistas) mediante una interfaz explícita, sin variables globales compartidas entre módulos. | `types` |
| `project-library` | Listar, crear, importar, abrir y cerrar proyectos; coordinar persistencia y el cambio entre biblioteca y proyecto. | `project-context`, `storage`, `archive` |
| `resource-explorer` | Construir y mostrar el árbol, navegar carpetas, buscar, seleccionar archivos y mostrar detalles. | `project-context` |
| `resource-operations` | Crear carpetas, renombrar, copiar, cortar y pegar recursos; persistir cambios y actualizar rutas relacionadas. | `project-context`, `storage`, `package-export` |
| `dictionary-editor` | Validar, editar y guardar el diccionario, manteniendo sus fichas sincronizadas con los archivos del proyecto. | `project-context`, `storage`, `archive` |
| `image-workbench` | Mostrar detalles de imágenes e integrar Photopea, incluida la recepción y persistencia de imágenes editadas. | `project-context`, `storage` |
| `package-export` | Exportar el proyecto completo o la selección, incluyendo `textures.ini` y el diccionario cuando corresponda. | `project-context`, `archive`, `storage` |

`types.ts`, `storage.ts` y `archive.ts` son la base existente y se conservarán inicialmente. Las dependencias entre módulos deben permanecer dirigidas hacia `project-context` y los servicios existentes; no se permiten dependencias circulares.

## Orden de trabajo propuesto

1. `project-context` — establecer y probar el límite del estado compartido.
2. `project-library` — extraer el ciclo de vida del proyecto.
3. `resource-explorer` — extraer árbol, navegación y selección.
4. `dictionary-editor` e `image-workbench` — extraer las herramientas del proyecto.
5. `package-export` — separar la generación de exportaciones.
6. `resource-operations` — extraer operaciones de recursos usando las interfaces ya estabilizadas.

Cada módulo tendrá su propia especificación, aprobación y verificación antes de avanzar a su planificación e implementación. Este orden podrá ajustarse si el análisis de dependencias durante el plan revela que otra secuencia es más segura.

## Estrategia de verificación acordada

- Incorporar Vitest y jsdom como dependencias de desarrollo para pruebas automatizadas.
- Añadir pruebas focalizadas por módulo y probar sus límites con dependencias simuladas cuando corresponda.
- Ejecutar `npm test` y `npm run build` desde `studio/` en cada incremento.
- Comprobar manualmente los flujos principales de biblioteca, navegación y selección, operaciones de recursos, edición del diccionario, Photopea y exportación.

## Límites

- **Siempre:** cambios incrementales, pruebas antes de extraer responsabilidades cuando sea posible, y conservación del comportamiento y formato de datos.
- **Preguntar antes:** cambiar el modelo de datos, la interfaz visible, el formato de exportación, incorporar dependencias adicionales a Vitest/jsdom o ampliar el alcance.
- **Nunca:** reescribir todo `main.ts` de una vez, mezclar cambios de producto con la refactorización o dejar dependencias circulares entre módulos.

## Especificaciones

- [SPEC-project-context.md](../specifications/SPEC-project-context.md) — módulo inicial, pendiente de aprobación.
