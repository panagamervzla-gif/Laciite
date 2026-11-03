# Tareas: organización funcional del repositorio

## Fase 1: Documentación

- [x] Mover mapa de refactorización y especificaciones a `docs/` y corregir sus referencias.
- [x] Crear guía canónica de organización con mapa de carpetas, prioridades y reglas para nuevos archivos.
- [x] Enlazar la guía desde `.github/copilot-instructions.md`.

## Fase 2: Código

- [x] Mover composición y estilos a `studio/src/app/`.
- [x] Mover almacenamiento, archivo/paquetes, tipos y pruebas relacionadas a `studio/src/project/`.
- [x] Mover módulos y pruebas de Photopea a `studio/src/photopea/`.
- [x] Actualizar imports, configuración de entrada y referencias internas sin cambiar comportamiento.

## Checkpoint final

- [x] No quedan referencias a las rutas antiguas.
- [x] `npm --prefix studio test` pasa.
- [x] `npm --prefix studio run build` pasa.
- [x] Los planes de Photopea y archivos ajenos permanecen intactos, salvo sus referencias a rutas actualizadas.
