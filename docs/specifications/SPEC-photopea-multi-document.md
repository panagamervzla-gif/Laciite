# Spec: edición de varias texturas en Photopea

## Objetivo

Permitir abrir varias texturas de proyectos Laccite en una sola instancia de Photopea y cambiar entre ellas usando las pestañas nativas del editor. Cada documento debe poder guardarse en el archivo y proyecto de IndexedDB desde los que se abrió, aunque el usuario haya abierto otro proyecto en la app mientras tanto.

El objetivo de esta mejora es mantener una sola instancia de Photopea para reducir consumo de recursos y preservar la sesión de edición, a la vez que se evita que los mensajes de guardado se apliquen a la textura equivocada.

## Supuestos y decisiones acordadas

- Se reutiliza un solo iframe de Photopea; no se crea un iframe por textura ni una barra de pestañas externa en la aplicación.
- Cada textura abierta se convierte en un documento distinto dentro de Photopea. Abrir otra textura no debe recargar el iframe ni cerrar los documentos existentes.
- Las pestañas y el cierre de documentos se manejan con los controles nativos de Photopea.
- Los documentos continúan abiertos al volver al gestor o cambiar de proyecto.
- Cada documento permanece vinculado al proyecto y archivo de origen. Guardar usa ese vínculo, no el proyecto que esté seleccionado actualmente en Laccite.
- Si el proyecto o el archivo de origen dejó de existir, o el contenido cambió desde que se abrió, el guardado se rechaza con un mensaje claro; nunca se crea ni sobrescribe silenciosamente otro recurso.
- Se conserva el formato de imagen original al exportar desde Photopea cuando ese formato está soportado actualmente.
- Se mantiene la interfaz y navegación existentes salvo los cambios mínimos necesarios para aclarar el documento activo y el resultado del guardado.

## Alcance funcional

1. Abrir la primera textura inicia Photopea con la configuración actual.
2. Abrir otra textura mientras Photopea ya está iniciado envía el contenido binario a la misma instancia y espera la confirmación de procesamiento antes de asociar el nuevo documento.
3. Cada documento recibe un identificador de origen único y metadatos de sesión suficientes para recuperar su proyecto, ruta y formato.
4. El botón de guardado de Laccite y la acción de guardado configurada en Photopea guardan el documento activo. La aplicación identifica primero el origen de ese documento, exporta con el formato asociado y escribe el blob en IndexedDB.
5. Si el usuario alterna las pestañas nativas de Photopea, el guardado debe continuar apuntando al documento activo, no al último archivo abierto desde Laccite.
6. La sesión de Photopea y sus vínculos sobreviven a la navegación entre la biblioteca y proyectos distintos durante la sesión de la página.
7. Mensajes de Photopea solo se procesan si corresponden al origen esperado y al iframe activo. Apertura, identificación del documento y guardado deben tolerar el orden asíncrono de los mensajes sin mezclar respuestas.
8. Si el archivo de origen se movió, renombró, eliminó o cambió desde que se abrió, la aplicación informa el conflicto y preserva los datos actuales en IndexedDB.

## Fuera de alcance

- Crear una barra de pestañas propia en Laccite o un botón externo para cerrar cada documento.
- Crear varias instancias de Photopea.
- Cambiar Photopea por otro editor o guardar documentos en un servidor.
- Cambiar el formato de almacenamiento de proyectos, el esquema de IndexedDB, los formatos admitidos o el diseño general de la aplicación.
- Resolver fusiones automáticas de dos ediciones concurrentes del mismo archivo. Un conflicto se informa y se requiere reabrir la versión actual antes de seguir editando.
- Refactorizar de forma general `main.ts`; solo se permite la separación local imprescindible para una integración segura y comprobable.

## Stack y referencias oficiales

El proyecto usa TypeScript 5.9, Vite 7, `idb` 8 y JSZip 3. La app obtiene los blobs de IndexedDB, los envía a Photopea como `ArrayBuffer` y guarda de vuelta los bytes recibidos como `Blob`.

La documentación oficial de Photopea describe:

- [Live Messaging API](https://www.photopea.com/api/live): envío de archivos binarios por `postMessage`, respuestas `"done"`, `app.echoToOE` y el uso de `Document.source` para identificar un documento al guardarlo.
- [Scripts API](https://www.photopea.com/learn/scripts): `Document.source` es de lectura/escritura y `Document.saveToOE()` envía los bytes del documento al entorno externo.
- [Environment API](https://www.photopea.com/api/environment): configuración de las acciones `customIO` de abrir y guardar.

La implementación debe respetar esos contratos y probar explícitamente el orden de los mensajes de la versión desplegada de Photopea.

## Comandos

Desde `studio/`:

```sh
npm test
npm run build
npm run dev
```

El proyecto aún no declara un runner de pruebas. Para esta funcionalidad se usarán Vitest y jsdom como dependencias de desarrollo, decisión aprobada previamente por el usuario para las pruebas del proyecto. No se instalarán durante la fase de especificación.

## Estructura propuesta

- `studio/src/app/main.ts`: mantiene la integración con la interfaz y coordina las acciones de abrir y guardar.
- `studio/src/project/storage.ts`: sigue siendo la capa de persistencia IndexedDB; se reutilizan sus operaciones existentes siempre que permitan proteger el archivo de origen.
- `studio/src/project/types.ts`: se mantienen los tipos persistidos existentes salvo aprobación explícita para cambiar el esquema.
- Un módulo local de integración Photopea y sus pruebas podrán extraerse si es necesario para verificar el protocolo sin importar el entrypoint completo. Esto no autoriza una refactorización general.
- Las pruebas vivirán junto a la lógica de protocolo o en la ubicación de tests que establezca el plan.

La ubicación y API exactas de cualquier helper se decidirán en el plan después de trazar el flujo actual de `openSelectedInPhotopea`, `handlePhotopeaMessage` y `requestPhotopeaSave`.

## Estilo y límites técnicos

- Seguir los patrones actuales de TypeScript, módulos ES y mensajes de estado de la interfaz.
- Mantener una sola instancia persistente del iframe mientras la página de la app esté activa.
- Usar identificadores opacos por documento y guardar en memoria el vínculo a proyecto, ruta y formato; no usar la ruta visible como única identidad del documento.
- Comprobar el archivo actual contra la versión cargada antes de guardar. Ante cambios concurrentes, rechazar el guardado en vez de perder datos.
- No guardar nada si la identificación del documento, el proyecto, la ruta o el formato no puede validarse.
- Limpiar errores de estado al completar una operación posterior con éxito y mostrar errores explícitos si Photopea o IndexedDB no responden como se espera.
- Evitar que mensajes fuera de orden, duplicados o de un documento anterior puedan guardar bytes en otro recurso.

## Estrategia de pruebas

- Añadir pruebas automatizadas con Vitest y jsdom para la máquina de estados/protocolo: inicio del iframe, apertura sucesiva, asignación de identificador, guardado del documento activo, formato correcto, cambios de proyecto y respuestas fuera de orden.
- Probar que el guardado resuelve el proyecto original aunque la aplicación haya cambiado de proyecto.
- Probar que una ruta inexistente, un proyecto eliminado o un contenido cambiado produce un error y no modifica ni crea archivos.
- Ejecutar `npm test` y `npm run build` desde `studio/`.
- Con el servidor de desarrollo abierto en el puerto 5173, verificar manualmente en el navegador: abrir dos texturas distintas, alternar entre pestañas de Photopea, guardar ambas y confirmar que cada blob correcto cambia en el proyecto correspondiente.
- Comprobar una sesión con archivos de formatos diferentes, como PNG y JPEG, para asegurar que la exportación de cada documento respeta su propio formato.

## Límites

- **Siempre:** conservar IndexedDB como almacenamiento local, mantener Photopea dentro de un único iframe, identificar el documento activo por su `source`, validar mensajes y proteger versiones modificadas concurrentemente.
- **Preguntar antes:** cambiar el modelo de datos persistido, añadir formatos de imagen, descartar documentos automáticamente, o ampliar la experiencia con una barra de pestañas y controles propios de Laccite.
- **Nunca:** confiar en el último archivo seleccionado como destino de guardado, aceptar mensajes de otros orígenes, borrar documentos abiertos al cambiar de proyecto, ni sobrescribir una versión que cambió desde que se abrió.

## Criterios de éxito

- Se pueden abrir dos o más texturas en la misma instancia de Photopea sin recargar el iframe.
- Los documentos abiertos aparecen y se pueden alternar con las pestañas nativas de Photopea.
- Guardar cada pestaña actualiza solo su archivo de origen en IndexedDB, incluso al alternar documentos o proyectos.
- El formato de salida se elige por documento, no por el último archivo seleccionado en Laccite.
- Los conflictos de proyecto, archivo o versión se notifican y no producen escrituras.
- Los mensajes de Photopea de origen o ventana incorrectos se ignoran.
- Las pruebas automatizadas pasan y `npm run build` termina correctamente.
- La verificación manual en navegador confirma apertura, alternancia, guardado y persistencia de más de una textura.

## Preguntas abiertas para el plan

- Determinar una estrategia compatible con los blobs actuales para detectar que el contenido de un archivo cambió desde que se abrió, sin introducir una migración de IndexedDB.
- Definir el protocolo de mensajes y correlación ante operaciones de apertura y guardado que se solapen.
- Determinar cómo reflejar el nombre y estado del documento activo en la barra superior de Laccite, dado que la documentación consultada no especifica un evento de cambio de pestaña nativa.
- Confirmar qué formatos devuelve Photopea al usar `saveToOE()` y cómo detectar errores o cancelaciones del usuario.
