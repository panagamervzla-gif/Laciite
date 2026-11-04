# Organización del repositorio

Esta guía es la fuente canónica para decidir dónde crear o mover archivos. Antes de cambiar la estructura, revisa también los imports, las rutas de compilación y los consumidores existentes; no muevas archivos solo para que los nombres de las carpetas parezcan uniformes.

## Mapa por prioridad y función

### Aplicación y despliegue

- `studio/` es la aplicación web y la raíz de Vite.
- `studio/index.html` debe permanecer en esa raíz; Vite la usa como documento de entrada.
- `studio/package.json`, `studio/package-lock.json` y `studio/tsconfig.json` son la fuente de dependencias, scripts y configuración de la aplicación.
- `vercel.json` permanece en la raíz porque configura el despliegue de Vercel.
- `README.md` describe cómo ejecutar y desplegar el proyecto.

### Código de la aplicación

- `studio/src/app/`: punto de entrada, composición de la aplicación, coordinación de vistas y estilos globales. `main.ts` conecta los dominios; evita añadir aquí lógica de negocio extensa.
- `studio/src/app/icons/`: recursos SVG compartidos de la interfaz; referencia los iconos existentes en vez de duplicar sus dibujos o incluirlos como caracteres Unicode en cada vista.
- `studio/src/app/settings/`: una función de configuración por módulo; cada preferencia mantiene su lectura/escritura y pruebas en esta carpeta, sin concentrar opciones no relacionadas en un único archivo.
- `studio/src/project/`: tipos del proyecto, persistencia IndexedDB, archivos y paquetes del proyecto, e importación/exportación. Las pruebas de esas responsabilidades viven junto a sus módulos.
- `studio/src/photopea/`: comunicación con Photopea, registro de documentos, guardado y pruebas de esa integración.

Para ubicar cambios de interfaz:

| Capacidad | Dominio de destino | Nota |
|---|---|---|
| Arranque, composición general y estilos globales | `studio/src/app/` | Mantener aquí el cableado entre dominios, no las reglas de negocio. |
| Gestor, explorador, inspector, notas/tareas y diccionario | `studio/src/project/` | Parte de la interfaz sigue en `app/main.ts`; localiza y reutiliza ese flujo. Al extraer una capacidad, crea un módulo bajo `project/` siguiendo el mapa de arquitectura. |
| Edición de imágenes y comunicación con Photopea | `studio/src/photopea/` | Mantener el protocolo y el guardado junto a la integración existente. |

Reglas para cambios de código:

1. Busca primero el módulo y patrón existente que ya posee la responsabilidad.
2. Coloca la lógica en el dominio correspondiente; deja en `app/` solo el arranque y el cableado de la interfaz.
3. Mantén las pruebas junto al módulo y usa el sufijo `.test.ts`.
4. Si una capacidad no encaja en `project/` ni en `photopea/`, consulta `docs/architecture/REFACTOR-MAP.md` y actualiza el mapa antes de crear otra carpeta de dominio.
5. No crees carpetas genéricas como `utils/`, `helpers/` o `misc/` para evitar decidir quién es dueño de una funcionalidad.

La interfaz existente aún concentra algunas vistas y flujos en `studio/src/app/main.ts`. Al extraer una capacidad, sigue el mapa de arquitectura y conserva su comportamiento; no dupliques esa lógica en un nuevo módulo.

### Documentación y trabajo en curso

- `docs/ORGANIZATION.md`: esta guía de ubicación y estructura.
- `docs/AI-HANDOFF.md`: guía de continuidad para agentes de IA, skills disponibles, automatizaciones y flujo de trabajo.
- `docs/architecture/`: mapas de módulos y decisiones arquitectónicas; el mapa actual es `REFACTOR-MAP.md`.
- `docs/specifications/`: especificaciones de capacidades y contratos antes de implementarlas.
- `tasks/`: planes y listas de trabajo activas. No reemplaces una lista incompleta de otra tarea; crea archivos separados y conserva su progreso.
- `.github/copilot-instructions.md`: instrucciones automáticas del workspace.
- `.github/skills/`, `.github/prompts/` y `.github/references/`: personalizaciones de agente agrupadas por tipo.
- `.vscode/`: configuración del editor para este workspace; no trasladarla a las carpetas de la aplicación.
- `skillsusage.md`: catálogo de skills del workspace, conservado en la raíz porque las instrucciones actuales lo referencian desde `.github/`.
- `.local/function-docs/`: guía local y privada de las operaciones disponibles para usuarios; contiene una página por operación y un índice. Está excluida de Git hasta que se prepare la documentación pública de lanzamiento.

### Datos y archivos especiales de raíz

- Conserva `textures.ini` en su ubicación actual mientras no se haya verificado y actualizado cada consumidor de ese dato.
- No crees manifiestos npm en la raíz para la aplicación: instala, prueba y compila desde el manifiesto de `studio/`.
- Mantén en la raíz los archivos requeridos por herramientas de repositorio o despliegue, por ejemplo `.gitignore` y `vercel.json`.

## Comandos de verificación

Desde la raíz del repositorio:

```sh
npm --prefix studio test
npm --prefix studio run build
```

Al mover módulos, actualiza todos sus imports y rutas de entrada; después busca referencias a la ruta anterior y ejecuta ambos comandos. No cambies contratos, datos persistidos, formato de exportación ni comportamiento de usuario como parte de una reorganización de carpetas.
