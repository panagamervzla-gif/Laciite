# Implementation Plan: zoom independiente del Inspector de imágenes

## Overview

Añadir controles de zoom propios a la vista **Inspector** para ampliar o reducir la imagen sin cambiar el zoom de la página. El Inspector ya presenta previsualización, ruta, dimensiones, formato y tamaño; el zoom debe afectar solo a la imagen y conservar los datos actuales.

## Decisiones acordadas

- Usar controles siempre visibles en el encabezado del Inspector: **−**, porcentaje editable, **+** y **Ajustar**. El control numérico junto con ambos botones da ajuste preciso sin ofrecer dos modos duplicados.
- No añadir una preferencia al menú **Configuración** para alternar entre slider y botones. Si se quisiera una segunda presentación, debe confirmarse como un alcance aparte.
- Interpretar 100% como tamaño de píxel nativo; la primera apertura de cada imagen usa **Ajustar** para que quepa en el área visible.
- El zoom manual afecta únicamente a la previsualización dentro del Inspector. Si la imagen supera el área visible, se puede arrastrar o mover con las flechas del teclado; las barras se ocultan y la página no se escala ni desplaza.
- Como valor inicial, limitar el zoom a 10%–800% en incrementos de 10%. El porcentaje introducido se valida dentro del mismo rango.
- Al abrir otra imagen, volver a **Ajustar**. Si la imagen está en modo ajustado, redimensionar la ventana vuelve a calcular ese ajuste; un zoom manual se conserva.
- Seguir TDD para las reglas de cálculo, actualizar la documentación privada de la operación junto con la interfaz y mantener el inventario exacto.

## Dependency Graph

```text
Modelo de escala y límites (puro)
        │
        ├── pruebas unitarias de zoom y ajuste a ventana
        ▼
Controles accesibles en el Inspector
        │
        ├── escala independiente de la página
        ├── overflow del escenario al ampliar
        └── comportamiento responsive / cambio de imagen
        ▼
Verificación manual en navegador
        │
        └── actualizar la ficha privada y el índice a 42 operaciones
```

## Task List

### Phase 1: Zoom model

- [x] Task 1: Define and test zoom calculations, input validation, bounds, and fit-to-stage behavior.

### Checkpoint: Zoom model

- [x] Focused zoom tests pass.
- [x] Fit calculation handles portrait, landscape, small and large images, and small available viewports.

### Phase 2: Inspector controls and rendering

- [x] Task 2: Add accessible Inspector controls and apply zoom only to its image stage.
- [x] Task 3: Verify zoom and panning interactions and state behavior with automated DOM tests; browser-only layout checks remain unavailable in this environment.

### Checkpoint: Inspector behavior

- [x] Unit and focused integration tests pass.
- [x] Production build succeeds.
- [ ] Manual browser checks confirm the image zoom does not change page zoom or expose page-level overflow. Chrome DevTools MCP and a local browser executable are unavailable; this check is not claimed as passed.

### Phase 3: User documentation

- [x] Task 4: Add the individual zoom-operation page and update the Inspector guide and private index to 42 active operations.

### Checkpoint: Complete

- [ ] All task acceptance criteria are met; manual browser layout verification is still pending.
- [ ] Full tests and production build pass.
- [x] Private documentation has exactly 42 active pages, all indexed once with valid links.
- [ ] Ready for user review before implementation is considered complete.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Large image dimensions cause layout overflow | High | Keep overflow within the Inspector stage and verify both axes at high zoom. |
| Zoom state leaks between images or after resize | Medium | Test that a newly opened image starts in Fit mode and that resize only recomputes Fit mode. |
| Invalid percentage input leaves controls and image out of sync | Medium | Validate/clamp input in a pure helper and test boundary and invalid values. |
| Header controls crowd the Inspector on narrow screens | Medium | Use compact labels and responsive wrapping; test mobile-width viewports. |
| User expects a slider or a configurable display mode | Low | Proposed default is minus + editable percentage + plus + Fit; no preference is added unless the user requests it. |
| Documentation is updated only after the feature and becomes stale | Medium | Make the new operation page and index count an explicit implementation task. |

## Verificación pendiente

- Interaction and bounds were approved before implementation: `− / percentage / + / Ajustar`, 10%–800%, 10% steps, reset to Fit on image change.
- Browser verification should use `/browser-testing-with-devtools` if available. If unavailable, record that limitation and do not claim browser checks passed.

## Implementation Commands

From the repository root:

```sh
npm --prefix studio test -- image-zoom.test.ts
npm --prefix studio test
npm --prefix studio run build
```

## Current Status

The approved zoom feature and image panning are implemented. Focused model, control, and panning tests and the production build pass. Browser-only visual checks remain pending because neither Chrome DevTools MCP nor a local browser executable is available in this environment.
