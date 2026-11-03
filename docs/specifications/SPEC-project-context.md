# Spec: project-context

## Objetivo

Extraer de `studio/src/app/main.ts` el estado compartido del proyecto activo y ofrecer una interfaz TypeScript explícita a los módulos de la aplicación. Esto reduce el acoplamiento a variables globales y crea una base comprobable para las extracciones posteriores.

El usuario de este módulo es el resto de la aplicación Studio. El cambio es interno: no debe alterar lo que ve el usuario ni cómo se guardan o exportan sus proyectos.

## Alcance del módulo

El estado inicial que se debe evaluar incluye el proyecto activo, archivos del proyecto, diccionario, mappings de texturas y el contexto compartido de selección necesario para las vistas. El inventario exacto y el API público mínimo se decidirán en el plan a partir de los consumidores existentes; el módulo no debe convertirse en un contenedor de toda la lógica de la aplicación.

## Comandos

Desde `studio/`:

```sh
npm test
npm run build
npm run dev
```

Vitest y jsdom, aprobados para la suite de pruebas, se añadirán como dependencias de desarrollo durante la fase de implementación correspondiente. Esta especificación no instala dependencias ni modifica código.

## Estructura del proyecto

- `studio/src/app/main.ts`: punto de entrada y composición de la aplicación; migrará a consumir la interfaz de contexto.
- `studio/src/project/types.ts`: tipos existentes del dominio.
- `studio/src/project/storage.ts`: persistencia existente en IndexedDB, fuera de este módulo.
- `studio/src/project/archive.ts`: importación, validación y exportación de paquetes, fuera de este módulo.
- `studio/src/project/project-context.ts` (propuesto): estado compartido tipado, sin interfaz DOM ni acceso directo a IndexedDB.
- `studio/src/project/project-context.test.ts` (propuesto): pruebas unitarias del estado y sus transiciones.

## Estilo y límites técnicos

- Mantener TypeScript, módulos ES y las convenciones existentes.
- Mantener el contexto independiente del DOM, de IndexedDB y de Photopea.
- No crear dependencias circulares; los módulos de funciones consumirán una API pública pequeña y tipada.
- Evitar copias mutables del estado que se desincronicen; las operaciones de lectura y actualización deben ser explícitas.
- No añadir abstracciones genéricas que no necesite esta aplicación.

## Estrategia de pruebas

- Usar Vitest para verificar inicialización, lectura, actualización y reinicio del contexto.
- Cubrir las transiciones relevantes con pruebas de estado inicializado, proyecto activo y cierre o reinicio de proyecto.
- Probar en `jsdom` solo cuando una prueba requiera entorno DOM; las pruebas puras del contexto no deben depender de él.
- Ejecutar `npm test` y `npm run build` desde `studio/`.
- Durante la extracción, comprobar manualmente que abrir y cerrar proyectos conserva la navegación y el contenido existentes.

## Límites

- **Siempre:** conservar el comportamiento actual, mantener los tipos explícitos y probar la API pública del módulo.
- **Preguntar antes:** cambiar el esquema persistido, la semántica de selección, la forma de los datos compartidos o agregar dependencias distintas de Vitest/jsdom.
- **Nunca:** acceder al DOM o a IndexedDB desde `project-context`, persistir estado nuevo por cuenta propia ni rediseñar la interfaz.

## Criterios de éxito

- El estado compartido aprobado para este módulo deja de declararse como variables globales de aplicación en `main.ts` y se administra a través de una interfaz tipada en `project-context`.
- El módulo puede probarse sin montar la aplicación ni acceder a almacenamiento del navegador.
- Las pruebas del módulo pasan con `npm test`.
- La aplicación compila con `npm run build`.
- Abrir, usar y cerrar un proyecto mantiene el mismo comportamiento observable.
- `project-context` no importa módulos de interfaz, almacenamiento ni archivo.

## Preguntas abiertas para el plan

- Delimitar qué estado de selección pertenece realmente al contexto compartido y cuál debe ser privado de `resource-explorer`, evitando incluir estado solo para simplificar la migración.
- Elegir la API mínima del contexto después de trazar los consumidores de `main.ts`.
- Determinar cómo probar la integración de módulos con `jsdom` sin mover lógica no relacionada en este primer incremento.
