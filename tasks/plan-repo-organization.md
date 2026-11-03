# Plan: organización funcional del repositorio

## Objetivo

Ordenar el código y la documentación por función, sin alterar el comportamiento de Laccite ni su proceso de despliegue. Añadir una guía canónica y enlazarla desde las instrucciones de Copilot para que futuras sesiones sepan dónde crear o mover archivos.

## Decisiones de estructura

- Mantener en la raíz los archivos que Vercel o npm esperan encontrar allí, `README.md`, el archivo de datos `textures.ini` y las instrucciones de selección de skills.
- Agrupar documentación de arquitectura y especificaciones en `docs/`.
- Mantener `tasks/` como carpeta de planes; no tocar el plan existente de Photopea.
- Agrupar la composición de la aplicación, el dominio de proyectos y Photopea en carpetas funcionales bajo `studio/src/`.
- Mantener las pruebas junto al módulo que verifican y conservar la entrada HTML de Vite en `studio/index.html`.
- Usar `.github/copilot-instructions.md` para exigir consulta de la guía canónica antes de crear o mover archivos.

## Tareas

1. Reubicar mapa y especificaciones en `docs/` y actualizar referencias relativas.
2. Reubicar módulos y pruebas bajo `studio/src/app/`, `studio/src/project/` y `studio/src/photopea/`; actualizar imports y la entrada HTML.
3. Crear `docs/ORGANIZATION.md` y enlazarla desde las instrucciones del workspace.
4. Ejecutar pruebas y build; revisar que no queden referencias a rutas antiguas ni cambios ajenos.

## Criterios de aceptación

- La guía identifica la responsabilidad de cada carpeta y dónde crear archivos para casos comunes.
- Las instrucciones del workspace remiten a la guía y exigen consultarla antes de crear o mover archivos.
- Vite, TypeScript y las pruebas funcionan con la nueva estructura.
- El diff no contiene cambios funcionales ni modificaciones a los archivos locales ajenos.
- Los planes de Photopea conservan su contenido y progreso; solo se actualizan enlaces y rutas afectadas por los movimientos.

## Verificación

Desde la raíz:

```sh
npm --prefix studio test
npm --prefix studio run build
```

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Una importación relativa queda apuntando a la ruta anterior | Buscar rutas antiguas y ejecutar TypeScript, pruebas y build |
| La entrada de Vite deja de resolverse | Actualizar el `script` de `studio/index.html` junto con el movimiento de `main.ts` |
| Se modifica por accidente otro trabajo local | No mover ni editar archivos sin relación; mantener los planes previos intactos |
