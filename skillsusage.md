# Guía de uso de las skills

Esta guía reúne las skills disponibles en `.github/skills/`: para cada una indica el comando y cuándo conviene pedírmela.

## Cómo pedirme una skill

Escribe el comando junto con el trabajo que necesitas. Por ejemplo:

> `/test-driven-development Corrige el cálculo del total y demuestra el arreglo con pruebas.`

También puedes pedirme una secuencia:

> `/spec-driven-development y /planning-and-task-breakdown Ayúdame a definir y dividir esta funcionalidad antes de implementarla.`

Si prefieres no usar el comando, puedes decir, por ejemplo, «usa la skill de pruebas guiadas por pruebas».

Al recibirlo, debo consultar las instrucciones de la skill y aplicar su flujo y verificaciones relevantes. Al empezar, puedo decirte qué skill usaré; al terminar, te indicaré qué pasos seguí y qué verificación ejecuté. **El comando orienta el trabajo, pero no es un mecanismo que garantice por sí solo que cada paso se cumpla.** Si no menciono una skill que esperabas, puedes corregirme con «usa `/nombre-de-la-skill`» o «¿qué skill estás usando?».

## Skills

### `/api-and-interface-design`

**Diseño de APIs e interfaces estables.** Pídela al crear o cambiar endpoints REST o GraphQL, contratos entre módulos o equipos, interfaces públicas, tipos compartidos, propiedades de componentes o esquemas de datos que determinan la forma de una API. Ayuda a definir límites claros, consistencia y compatibilidad para que los consumidores puedan usar el contrato sin depender de detalles internos. También es útil antes de modificar una interfaz existente que otros módulos o clientes ya utilizan.

### `/browser-testing-with-devtools`

**Pruebas y diagnóstico en un navegador real.** Pídela cuando algo se renderiza o ejecuta en el navegador: verificar interacciones y diseño visual, inspeccionar DOM y consola, revisar solicitudes y respuestas de red, medir tiempos de carga o confirmar que una corrección funciona en runtime. No suele aportar para cambios exclusivamente de backend o de línea de comandos. Esta skill requiere que el servidor MCP de Chrome DevTools esté configurado; si no está disponible, debo avisarte y no fingir una verificación en navegador.

### `/ci-cd-and-automation`

**Pipelines y controles automatizados.** Pídela para crear o modificar CI/CD, configurar pruebas y verificaciones automáticas, establecer puertas de calidad, automatizar despliegues o investigar fallos de un pipeline. Sirve tanto al incorporar automatización a un proyecto como cuando un workflow existente falla o necesita ejecutar controles nuevos ante ciertos cambios.

### `/code-review-and-quality`

**Revisión de cambios antes de integrarlos.** Pídela para revisar un diff, pull request o código generado por una persona o agente; especialmente antes de fusionar, después de una funcionalidad o corrección, o al evaluar un refactor. El objetivo es encontrar problemas de corrección, regresiones y calidad con evidencia, no reescribir todo el código ni limitarse a comentarios de estilo.

### `/code-simplification`

**Simplificación sin cambiar el comportamiento.** Pídela cuando el código ya funciona, pero resulta difícil de leer o mantener por anidamiento, funciones extensas, nombres poco claros, duplicación o lógica relacionada dispersa. Es apropiada después de tener una implementación verificada o cuando una revisión detecta complejidad innecesaria. No es para reescribir código cuyo propósito aún no se entiende ni para simplificar por deporte.

### `/constraint-driven-development`

**Definición de estándares y umbrales de calidad.** Pídela cuando el proyecto no tiene una barra de calidad explícita o quieres acordar controles medibles —por ejemplo accesibilidad, rendimiento o cobertura— y decidir cuáles bloquean una entrega. También sirve si se están silenciando linters, quitando pruebas o rebajando umbrales para obtener una señal verde. El flujo puede registrar estas reglas en `CONSTRAINTS.md`; antes de crear o cambiar ese archivo, aclararé el alcance contigo. No hace falta aplicarla si ya existe un estándar vigente que no quieres cambiar.

### `/context-engineering`

**Preparación del contexto para trabajar mejor con el agente.** Pídela al iniciar un proyecto o sesión, cambiar a otra parte del código, configurar instrucciones o reglas para agentes, o cuando mis respuestas empiecen a ignorar convenciones, usar patrones incorrectos o asumir APIs inexistentes. Sirve para identificar qué contexto relevante cargar y cómo mejorar las instrucciones; no reemplaza investigar la fuente real de un comportamiento.

### `/debugging-and-error-recovery`

**Diagnóstico sistemático de la causa raíz.** Pídela si fallan pruebas o compilaciones, aparece un error en logs o consola, el resultado no coincide con lo esperado, llega un reporte de bug o algo que antes funcionaba dejó de hacerlo. El objetivo es reunir evidencia, aislar la causa y corregirla sin adivinar ni tapar el síntoma con cambios no relacionados.

### `/deprecation-and-migration`

**Retiro y migración segura de sistemas existentes.** Pídela al sustituir una API, biblioteca o implementación; retirar una funcionalidad; consolidar duplicados; decidir si mantener un sistema heredado; o planificar una migración de datos o esquema de producción, como renombrar o eliminar columnas sin interrumpir el servicio. Ayuda a considerar la transición y a quienes todavía dependen de lo antiguo, no solo el estado final.

### `/documentation-and-adrs`

**Documentación útil y registro de decisiones.** Pídela al registrar una decisión arquitectónica y sus alternativas, cambiar una API pública, publicar un cambio visible para usuarios, incorporar a nuevos miembros o agentes, o cuando haya que explicar repetidamente el mismo contexto. Conviene documentar el porqué, los límites y las consecuencias. No es necesario para comentar código obvio ni para crear documentos sobre prototipos desechables.

### `/doubt-driven-development`

**Revisión adversarial de decisiones no triviales.** Pídela si quieres que cuestione supuestos y busque modos de fallo antes de avanzar, especialmente en código desconocido, autenticación de producción, seguridad, migraciones de alto riesgo, operaciones irreversibles o decisiones que cruzan módulos. También es útil cuando una afirmación como «esto es seguro» o «esto escala» necesita comprobarse. No hace falta para renombrar una variable, formatear o hacer un cambio mecánico obvio.

### `/frontend-ui-engineering`

**Construcción y mejora de interfaces de usuario.** Pídela para crear o modificar páginas y componentes, implementar layouts responsivos, interacciones y estado, arreglar problemas de UX o cumplir requisitos de accesibilidad WCAG. Está pensada para lograr una interfaz coherente, usable y lista para producción, no solo para que compile. Si también hay que verificarla en runtime, puede combinarse con `/browser-testing-with-devtools`.

### `/git-workflow-and-versioning`

**Organización del trabajo y flujo Git.** Pídela al preparar cambios en Git, ordenar un árbol de trabajo con modificaciones mezcladas, crear ramas o commits, resolver conflictos, dividir cambios en commits atómicos, preparar un pull request, decidir una versión semántica, etiquetar una release o redactar changelog y mensajes de commit. La skill declara que aplica a todo cambio de código; para documentación solamente, úsala si además quieres organizar o publicar ese cambio con Git.

### `/idea-refine`

**Exploración y refinamiento de una idea todavía abierta.** Pídela cuando tengas un concepto inicial y quieras generar alternativas, poner a prueba supuestos y elegir una dirección antes de comprometerte con un plan o especificación. Es útil para idear y stress-testear propuestas. Si todavía no sabes qué necesitas en absoluto, usa `/interview-me`; si ya elegiste la dirección y necesitas requisitos concretos, usa `/spec-driven-development`.

### `/incremental-implementation`

**Implementación por partes pequeñas y verificables.** Pídela para una funcionalidad que toca varios archivos, al ejecutar tareas de un plan, refactorizar, desplegar gradualmente detrás de una feature flag o cuando el cambio sea demasiado grande para escribirlo y comprobarlo de una sola vez. Divide el trabajo en incrementos que puedan verificarse individualmente. Para un cambio mínimo y autocontenido de un solo archivo, normalmente no es necesaria.

### `/interview-me`

**Entrevista para aclarar lo que realmente necesitas.** Pídela si la solicitud no define quién usará el resultado, por qué importa, cómo se medirá el éxito o qué restricciones son obligatorias; si hay varias prioridades en conflicto; o si quieres que te interrogue antes de proponer una solución. También puedes invocarla diciendo «entrevístame», «hazme preguntas» o «¿estamos seguros?». No hace falta para una petición precisa y autosuficiente ni para consultas puramente informativas.

### `/observability-and-instrumentation`

**Logs, métricas, trazas y alertas para entender producción.** Pídela al instrumentar una funcionalidad que se desplegará, añadir un endpoint, servicio, tarea en segundo plano o integración externa, revisar cambios con I/O, reintentos, colas o llamadas entre servicios, o mejorar alertas. También es apropiada si un incidente tardó demasiado en diagnosticarse por falta de datos. Para resolver un fallo que ocurre ahora, usa `/debugging-and-error-recovery`; para optimizar lentitud medida, `/performance-optimization`.

### `/performance-optimization`

**Medición y mejora del rendimiento.** Pídela si hay requisitos concretos de latencia o carga, reportes de lentitud, regresiones sospechadas, Core Web Vitals bajos, consultas N+1, conjuntos de datos grandes o un cuello de botella revelado por profiling. Busca basar la optimización en mediciones y en la capa afectada (frontend, backend, consultas o base de datos). No conviene optimizar prematuramente sin evidencia de un problema.

### `/planning-and-task-breakdown`

**Conversión de requisitos claros en tareas ejecutables.** Pídela cuando ya tienes una especificación o requisitos definidos y quieres dividirlos en unidades pequeñas con criterios de aceptación y orden de dependencias. También ayuda a estimar alcance, comunicar el plan o identificar trabajo que puede paralelizarse. Si los requisitos todavía son ambiguos, acláralos primero con `/interview-me` o `/spec-driven-development`.

### `/security-and-hardening`

**Diseño seguro y endurecimiento frente a vulnerabilidades.** Pídela al auditar entradas o endpoints, trabajar con autenticación, autorización, sesiones, datos sensibles o personales, pagos, archivos, webhooks, integraciones externas o dependencias y cadena de suministro. También sirve para revisar riesgos frente a OWASP y privacidad. Si la petición es específicamente una revisión de seguridad, puedo centrar la tarea en detectar y explicar vulnerabilidades; si quieres que implemente correcciones, indícalo expresamente.

### `/shipping-and-launch`

**Preparación de una entrega o despliegue a producción.** Pídela antes de publicar una funcionalidad importante, desplegar por primera vez, migrar datos o infraestructura, abrir una beta o planificar un rollout con riesgo. Ayuda a revisar preparación, monitorización, etapas de despliegue y estrategia de rollback para que el lanzamiento sea observable y recuperable.

### `/source-driven-development`

**Implementación basada en documentación oficial y vigente.** Pídela cuando la corrección depende de una versión o framework, quieres patrones respaldados por fuentes, vas a crear boilerplate reutilizable, o necesitas verificar las recomendaciones oficiales sobre routing, formularios, datos, estado o autenticación. También puede servir al revisar código específico de un framework. No suele hacer falta para cambios mecánicos o lógica independiente de versiones.

### `/spec-driven-development`

**Especificación antes de programar.** Pídela para iniciar un proyecto o funcionalidad, redactar un PRD, convertir una idea vaga en objetivos, alcance y límites, o descomponer un requisito que abarca varias capacidades comprobables. Es especialmente útil cuando faltan decisiones importantes o se prevé un cambio arquitectónico o de más de una media hora. Para un arreglo de una línea con requisitos claros, normalmente basta con implementar y verificar directamente.

### `/test-driven-development`

**Desarrollo guiado por pruebas (rojo, verde, refactor).** Pídela al añadir lógica o comportamiento, arreglar un bug, modificar funcionalidad o cubrir casos límite. La prueba debe demostrar primero el problema o requisito; después se implementa y se vuelve a ejecutar para comprobar la corrección. No suele ser necesaria para documentación, contenido estático o configuración sin efecto de comportamiento.

### `/using-agent-skills`

**Selección de la skill y flujo adecuados para una tarea.** Pídela si no sabes qué skill elegir o quieres que identifique el flujo antes de empezar. Ayuda a relacionar fases como aclarar una idea, especificar, planificar, implementar, probar, revisar y publicar; también recuerda exponer supuestos, detenerse ante ambigüedades y verificar el resultado. Puedes usarla al inicio y añadir después skills más específicas según lo que encontremos.
