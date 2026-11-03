# Implementation Plan: edición de varias texturas en Photopea

## Overview

Implementar la especificación aprobada en [SPEC-photopea-multi-document.md](../docs/specifications/SPEC-photopea-multi-document.md): mantener una única instancia de Photopea, abrir varias texturas en documentos nativos, y guardar cada documento en su proyecto y archivo de origen en IndexedDB. La refactorización general de `main.ts` queda fuera de este plan.

## Architecture Decisions

- Mantener un único iframe y una cola serializada para mensajes de apertura y guardado. Photopea confirma cada mensaje con `"done"`; no se enviará el siguiente paso de una apertura hasta recibir la confirmación esperada.
- Asignar a cada documento un identificador opaco en `Document.source`. Un registro de sesión en memoria relacionará ese identificador con proyecto, ruta, formato de exportación, MIME y huella del contenido original.
- El script de guardado consultará el `source` del documento activo y enviará identificador y bytes en la misma operación; así el formato y destino corresponden a la pestaña activa aunque cambie la selección en Laccite.
- Calcular una huella SHA-256 del blob al abrir y contrastarla con el archivo actual antes de escribir. Si el proyecto o el archivo falta o la huella no coincide, rechazar el guardado con un error visible.
- Mantener los documentos abiertos al navegar entre proyectos. El mapa de sesión permite guardar en el proyecto de origen; las escrituras solo refrescan la vista local si ese mismo proyecto está activo.
- No crear UI externa de pestañas. El título de la barra de Laccite no afirmará qué pestaña nativa está activa, ya que la API oficial consultada no documenta un evento de cambio de pestaña; el resultado del guardado sí identificará el archivo resuelto.
- Añadir Vitest y jsdom para pruebas de la máquina de estados y del protocolo; no agregar una capa de pruebas de IndexedDB ni migrar su esquema en esta funcionalidad.

## Dependency Graph

```text
Vitest/jsdom
    │
    ▼
Registro de documentos y protocolo Photopea (puro y comprobable)
    │
    ├── Cola de apertura ──→ iframe único + documentos nativos
    │
    └── Correlación de guardado ──→ validación de proyecto/archivo/huella
                                         │
                                         ▼
                                 persistencia IndexedDB existente
```

La API Live Messaging de Photopea y su semántica de `"done"`, `Document.source`, `echoToOE` y `saveToOE` se citan en la especificación. La prueba manual en navegador es obligatoria porque el protocolo real depende del servicio externo.

## Task List

### Phase 1: Protocol foundation

- [x] Task 1: Add Vitest/jsdom and implement a testable Photopea session registry.
- [x] Task 2: Reuse the iframe and open sequential documents through native Photopea tabs. Browser verification remains pending.

### Checkpoint: Open multiple documents

- [x] `npm test` and `npm run build` pass.
- [ ] In the browser, opening a second texture does not reload the iframe or close the first document.
- [ ] Confirm the actual `"done"` sequence and source assignment against Photopea.
- [ ] Review the message-state behavior before implementing persistence.

### Phase 2: Correct and safe persistence

- [x] Task 3: Route active-document saves to the source project and reject stale files.
- [ ] Task 4: Verify multi-document save behavior and finish user-facing statuses.

### Checkpoint: Ready for review

- [x] Each document saves to its original project, independent of the currently selected project.
- [x] Unknown-source, missing-project, missing-file and stale-content cases do not write data; wrong-origin messages are ignored by the existing origin/window guard.
- [x] PNG, JPEG, WebP and GIF documents preserve their respective formats.
- [x] `npm test` and `npm run build` pass.
- [ ] The browser acceptance flow passes.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Photopea emits messages in a different order than expected | High | Serialize commands, correlate each state transition, and verify with the live editor before persistence integration. |
| An active document's source or format is misidentified | High | Give every open document an opaque ID and store format per document; save script emits the active document ID before bytes. |
| Photopea keeps a document open after its project file is deleted or changed | High | Resolve the original project and exact path at save time and compare the current content hash; surface conflicts without writing. |
| Switching projects updates the wrong project's in-memory UI | Medium | Always persist using the mapped source project; update visible state only when that project is active. |
| Many large documents consume memory | Medium | Use one Photopea iframe and native document close controls; avoid duplicate editor runtimes. |
| Photopea does not expose a documented active-tab change event | Medium | Do not display a potentially stale active filename in Laccite; identify the source during save. |

## Open Questions

- If the user attempts to save after the source content changed, the application will reject the save. Reopening the current version is the recovery path; automatic merge is out of scope.
- If Photopea's actual message ordering differs from the documented API, stop at the checkpoint and revise the protocol/spec before continuing.

## Implementation Commands

Run from `studio/`:

```sh
npm test
npm run build
npm run dev -- --port 5173
```

## Current Status

Tasks 1–3 are implemented. The complete automated test suite and production build pass; task 4 remains open for interactive browser verification at `http://localhost:5173/`.
