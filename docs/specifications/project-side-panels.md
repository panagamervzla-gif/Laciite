# Especificación: paneles laterales de proyecto

## Objetivo

Separar Notas generales, Lista de tareas y Notas del archivo en paneles derechos independientes, seleccionables desde un desplegable superior. Solo un panel puede estar abierto; se cierra con su botón para volver a mostrar el selector. El panel activo mantiene el redimensionamiento existente.

## Capacidad y orden

| Capacidad | Responsabilidad | Dependencias |
|---|---|---|
| panel-shell | Selector, panel único, cierre, ancho redimensionable y estilo común | — |
| project-memos | Notas generales múltiples, tituladas, CRUD y borrado múltiple | panel-shell, almacenamiento |
| project-todos | Lista vertical, check, edición en línea y borrado múltiple | panel-shell, confirmación |
| resource-memos | Índice agrupado por archivo, notas múltiples, navegación, metadatos y CRUD | panel-shell, almacenamiento, Gestor |

Orden: contratos/almacenamiento → panel-shell → project-todos → project-memos → resource-memos → ZIP e integración final.

## Contrato de UX

- Los tres paneles usan la misma jerarquía, espaciado, tarjetas, controles y estados vacíos.
- El selector superior es un desplegable con Notas generales, Lista de tareas y Notas del archivo.
- Cada panel abre por separado, se puede cerrar y tiene un separador redimensionable con ratón y teclado. Al cerrar, vuelve a mostrarse el selector.
- Tareas: lista vertical con checkbox de completado; alta y edición en línea. El modo Borrar muestra checks de selección; Cancelar sale del modo; confirmar borra solo las seleccionadas.
- Notas generales: lista vertical contraída por título; creación y edición en línea de título/contenido; selección múltiple y confirmación de borrado.
- Notas de archivo: una fila por archivo con notas. Expandir muestra cada nota individual, su edición en línea y ruta, peso y dimensiones. Navegar seleccionando el archivo lleva el Gestor a su carpeta y mantiene el panel abierto. Un archivo seleccionado sin notas ofrece crear la primera; solo aparece en el índice al guardarla.
- Las confirmaciones destructivas reutilizan el diálogo existente.

## Persistencia y compatibilidad

- La base IndexedDB sube a versión 4 con stores para notas generales y notas por recurso, cada nota con ID, título, contenido y timestamps.
- Por decisión explícita del usuario, el upgrade elimina los stores antiguos `projectNotes` y `resourceNotes` y su contenido. `projectTodos`, archivos, mappings y resto de datos del proyecto se conservan.
- Los ZIP exportados usan el formato de notas actualizado. Los manifiestos de notas v1 importados se aceptan y adaptan al nuevo formato; tareas y asociaciones de recursos se conservan.

## Stack y comandos

- TypeScript, Vite, IndexedDB a través de `idb`, Vitest con `fake-indexeddb`/jsdom.
- Pruebas: `npm --prefix studio test`
- Build y tipos: `npm --prefix studio run build`

## Estructura

- UI y composición: `studio/src/app/`; pruebas junto a módulos `.test.ts`.
- Tipos y persistencia: `studio/src/project/types.ts` y `studio/src/project/storage.ts`.
- Formato portátil: `studio/src/project/archive.ts`.
- Contratos visibles del panel: `studio/index.html`; tokens y responsive en `studio/src/app/styles.css`.

## Éxito verificable

- Un único panel visible a la vez; selector reaparece al cerrar.
- Redimensionamiento accesible por pointer y flechas, con ancho central mínimo protegido y sin desbordar el Gestor.
- Crear, editar, completar, buscar/navegar y borrar notas/tareas actualiza IndexedDB y sobrevive a reabrir el proyecto.
- El índice agrupa notas por recurso y presenta metadatos; navegar no cierra el panel.
- El upgrade elimina solo las notas antiguas y conserva tareas/archivos/proyectos.
- Import/export mantiene compatibilidad con manifiestos ZIP v1 y serializa el formato actual.
- Suite completa y build pasan.

## Límites

- Hacer: conservar IDs de recursos y mappings; mostrar errores de persistencia explícitamente; reutilizar el diálogo de confirmación.
- No hacer: añadir fechas/prioridades de tareas, editor de archivos, dependencias nuevas o cambios al Gestor fuera de la navegación solicitada.
- La eliminación local de notas antiguas está aprobada explícitamente; no se migran al nuevo formato.
