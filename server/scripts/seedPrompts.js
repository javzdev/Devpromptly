/**
 * Script para insertar 24 prompts de biblioteca en la base de datos.
 * Uso: node server/scripts/seedPrompts.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpromts';

// ─── Datos de los 24 prompts ───────────────────────────────────────────────

const PROMPTS = [
  // ── PROGRAMACIÓN / DEV ──────────────────────────────────────────────────
  {
    title: 'Revisor de Código Limpio',
    description: 'Analiza un fragmento de código y sugiere mejoras de legibilidad, estructura y buenas prácticas.',
    prompt: `Actúa como un senior developer con 10 años de experiencia. Revisa el siguiente código y proporciona:
1) Problemas de legibilidad
2) Violaciones de principios SOLID o DRY
3) Sugerencias de refactorización con ejemplos concretos
4) Puntuación de calidad del 1 al 10

Código: [PEGAR_CÓDIGO]`,
    category: 'code-generation',
    aiTool: 'Claude',
    tags: ['código', 'refactorización', 'clean code', 'revisión', 'buenas prácticas'],
  },
  {
    title: 'Generador de Tests Unitarios',
    description: 'Genera casos de prueba unitarios completos para una función o módulo dado.',
    prompt: `Eres un experto en QA y testing. Para la siguiente función en [LENGUAJE], genera tests unitarios que cubran: casos normales, casos borde, entradas inválidas y errores esperados. Usa el framework [JEST/PYTEST/JUNIT]. Incluye comentarios explicando cada caso.

Función: [PEGAR_FUNCIÓN]`,
    category: 'code-generation',
    aiTool: 'Claude',
    tags: ['testing', 'QA', 'unit tests', 'automatización', 'jest'],
  },
  {
    title: 'Arquitecto de Base de Datos',
    description: 'Diseña el esquema de base de datos relacional a partir de una descripción del sistema.',
    prompt: `Actúa como un arquitecto de datos experto. A partir de la siguiente descripción del sistema, diseña:
1) Diagrama de entidades (en formato texto/ASCII)
2) Tablas con campos, tipos de dato y restricciones
3) Relaciones y claves foráneas
4) Índices recomendados
5) Justificación de cada decisión

Sistema: [DESCRIPCIÓN]`,
    category: 'code-generation',
    aiTool: 'Claude',
    tags: ['base de datos', 'SQL', 'esquema', 'arquitectura', 'modelado'],
  },
  {
    title: 'Documentador de API',
    description: 'Genera documentación profesional estilo OpenAPI/Swagger a partir de endpoints descritos.',
    prompt: `Eres un technical writer especializado en APIs REST. A partir de la siguiente lista de endpoints, genera documentación completa en formato Markdown que incluya: descripción, método HTTP, parámetros, body, respuestas (200, 400, 500), ejemplos de request/response y notas de autenticación.

Endpoints: [LISTA_DE_ENDPOINTS]`,
    category: 'code-generation',
    aiTool: 'Claude',
    tags: ['API', 'documentación', 'REST', 'Swagger', 'OpenAPI'],
  },
  {
    title: 'Debugger Inteligente',
    description: 'Identifica la causa raíz de un error o bug y propone soluciones paso a paso.',
    prompt: `Actúa como un experto en debugging. Analiza el siguiente error y proporciona:
1) Causa raíz probable
2) Explicación del por qué ocurre
3) Pasos para reproducirlo
4) Solución recomendada con código
5) Cómo prevenir este error en el futuro

Error: [MENSAJE_DE_ERROR]
Código relevante: [CÓDIGO]`,
    category: 'code-generation',
    aiTool: 'Claude',
    tags: ['debugging', 'errores', 'bug fix', 'solución', 'diagnóstico'],
  },
  {
    title: 'Revisor de Seguridad de Código',
    description: 'Detecta vulnerabilidades y fallos de seguridad en fragmentos de código.',
    prompt: `Actúa como un experto en ciberseguridad y secure coding. Analiza el siguiente código y detecta:
1) Vulnerabilidades OWASP Top 10 presentes
2) Riesgos de inyección (SQL, XSS, etc.)
3) Manejo inseguro de datos sensibles
4) Problemas de autenticación o autorización
5) Dependencias con vulnerabilidades conocidas

Para cada hallazgo indica: severidad (Crítica/Alta/Media/Baja), descripción y solución recomendada con código corregido.

Código: [PEGAR_CÓDIGO]`,
    category: 'code-generation',
    aiTool: 'Claude',
    tags: ['seguridad', 'OWASP', 'vulnerabilidades', 'ciberseguridad', 'secure coding'],
  },

  // ── MARKETING / NEGOCIOS ─────────────────────────────────────────────────
  {
    title: 'Estratega de Contenido para Redes Sociales',
    description: 'Crea un plan de contenido mensual completo para una marca en redes sociales.',
    prompt: `Eres un estratega de marketing digital con experiencia en growth. Crea un plan de contenido de 30 días para [MARCA/PRODUCTO] en [PLATAFORMAS]. Incluye:
1) Pilares de contenido
2) Calendario con fechas y temas
3) Formatos sugeridos (carrusel, reel, story, etc.)
4) Copys de ejemplo para 5 publicaciones
5) CTAs recomendados
6) KPIs a medir

Público objetivo: [DESCRIPCIÓN]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['redes sociales', 'contenido', 'marketing', 'calendario', 'estrategia'],
  },
  {
    title: 'Redactor de Email Marketing',
    description: 'Escribe secuencias de emails de venta altamente persuasivas con estructura probada.',
    prompt: `Eres un copywriter especialista en email marketing con dominio del framework AIDA. Crea una secuencia de [N] emails para [PRODUCTO/SERVICIO] con el objetivo de [CONVERSIÓN/NURTURING/REACTIVACIÓN]. Para cada email incluye: asunto (3 variantes A/B), preheader, cuerpo del email, CTA y temporizador de envío.

Tono: [FORMAL/CASUAL/URGENTE]
Audiencia: [DESCRIPCIÓN]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['email', 'copywriting', 'AIDA', 'ventas', 'secuencia', 'conversión'],
  },
  {
    title: 'Analizador de Competencia',
    description: 'Estructura un análisis competitivo profundo de una empresa o producto del mercado.',
    prompt: `Actúa como un analista de mercado senior. Realiza un análisis competitivo de [EMPRESA/PRODUCTO] frente a sus competidores principales. Estructura el análisis en:
1) Posicionamiento y propuesta de valor
2) Matriz FODA
3) Análisis de precios
4) Canales de distribución
5) Estrategia de comunicación
6) Brechas y oportunidades detectadas

Sector: [INDUSTRIA]`,
    category: 'text-generation',
    aiTool: 'Perplexity',
    tags: ['competencia', 'análisis', 'FODA', 'mercado', 'estrategia', 'benchmarking'],
  },
  {
    title: 'Creador de Propuesta de Valor',
    description: 'Define y redacta la propuesta de valor única de un producto o servicio.',
    prompt: `Eres un consultor de branding y estrategia. Usando el Value Proposition Canvas, ayúdame a definir la propuesta de valor de [PRODUCTO/SERVICIO]. Considera:
1) Jobs-to-be-done del cliente
2) Pains y gains del cliente
3) Pain relievers y gain creators del producto
4) Fit entre oferta y demanda
5) Statement de propuesta de valor en una oración

Cliente ideal: [DESCRIPCIÓN]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['propuesta de valor', 'branding', 'canvas', 'posicionamiento', 'cliente ideal'],
  },
  {
    title: 'Generador de Scripts para Ventas',
    description: 'Crea guiones de ventas conversacionales para llamadas, demos o pitches.',
    prompt: `Eres un coach de ventas experto en metodología SPIN Selling. Crea un script completo para [TIPO: llamada en frío / demo / pitch de inversión] de [PRODUCTO/SERVICIO]. Incluye: apertura, preguntas de descubrimiento, manejo de objeciones comunes (mínimo 5), propuesta de valor adaptada y cierre.

Duración estimada: [X] minutos
Sector: [INDUSTRIA]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['ventas', 'script', 'SPIN', 'objeciones', 'pitch', 'demo'],
  },
  {
    title: 'Generador de Landing Page Copy',
    description: 'Escribe todo el texto persuasivo y estructurado para una landing page de producto.',
    prompt: `Eres un copywriter de conversión especializado en landing pages. Escribe el copy completo para la landing page de [PRODUCTO/SERVICIO] siguiendo esta estructura:
1) Headline principal + subheadline
2) Propuesta de valor en 3 bullets
3) Sección de problema y agitación
4) Presentación de la solución
5) Beneficios vs. características
6) Prueba social (3 testimonios ficticios realistas)
7) FAQ (5 preguntas)
8) CTA final con urgencia

Audiencia: [DESCRIPCIÓN]
Precio: [RANGO]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['landing page', 'copy', 'conversión', 'ventas', 'copywriting', 'web'],
  },

  // ── DISEÑO / CREATIVIDAD ─────────────────────────────────────────────────
  {
    title: 'Brief Creativo para Diseñador',
    description: 'Genera un brief detallado para encargar un proyecto de diseño gráfico o visual.',
    prompt: `Actúa como un director creativo. Elabora un brief completo para el diseño de [PIEZA: logo / landing page / packaging / identidad visual] para [MARCA]. Incluye:
1) Contexto y objetivos
2) Público objetivo
3) Tono y personalidad de marca
4) Paleta de colores y tipografía referencial
5) Referencias visuales (describe 3 ejemplos)
6) Entregables esperados
7) Restricciones o elementos obligatorios`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['diseño', 'brief', 'branding', 'identidad visual', 'creatividad'],
  },
  {
    title: 'Generador de Prompts para Midjourney / DALL·E',
    description: 'Crea prompts altamente optimizados para generar imágenes con IA generativa.',
    prompt: `Eres un experto en ingeniería de prompts visuales para IA generativa. A partir de la siguiente descripción de imagen, genera 3 variantes de prompt optimizadas para [MIDJOURNEY/DALL·E]. Cada prompt debe incluir: sujeto principal, estilo artístico, iluminación, paleta de colores, cámara/ángulo, estado de ánimo y parámetros técnicos (--ar, --style, --v).

Descripción: [IMAGEN_DESEADA]`,
    category: 'image-generation',
    aiTool: 'Midjourney',
    tags: ['Midjourney', 'DALL·E', 'imagen IA', 'prompt engineering', 'arte generativo'],
  },
  {
    title: 'Crítico de UX / UI',
    description: 'Evalúa una interfaz desde principios de usabilidad y experiencia de usuario.',
    prompt: `Actúa como un experto en UX con enfoque en heurísticas de Nielsen. Evalúa la siguiente interfaz / flujo de usuario y proporciona:
1) Fortalezas de la experiencia actual
2) Problemas de usabilidad detectados (clasificados por severidad)
3) Recomendaciones concretas de mejora
4) Cambios de alta prioridad vs. nice-to-have
5) Puntuación UX del 1 al 10 con justificación

Descripción/pantallas: [DESCRIPCIÓN_O_URL]`,
    category: 'other',
    aiTool: 'Claude',
    tags: ['UX', 'UI', 'usabilidad', 'heurísticas', 'diseño de interfaz', 'feedback'],
  },
  {
    title: 'Escritor Creativo de Historias',
    description: 'Genera historias cortas, guiones o narraciones con estructura dramática sólida.',
    prompt: `Eres un escritor creativo con dominio del viaje del héroe (Joseph Campbell). Escribe una historia corta de [N] palabras sobre [TEMA/PREMISA]. Sigue esta estructura:
1) Mundo ordinario del protagonista
2) Llamado a la aventura
3) Conflicto central
4) Clímax y transformación
5) Resolución

Género: [THRILLER/DRAMA/COMEDIA/SCI-FI]
Tono: [DESCRIPCIÓN]
Incluye diálogos.`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['escritura creativa', 'storytelling', 'narrativa', 'viaje del héroe', 'ficción'],
  },
  {
    title: 'Naming de Marca o Producto',
    description: 'Genera y evalúa nombres creativos para marcas, productos o servicios.',
    prompt: `Actúa como un especialista en naming y branding. Genera 15 nombres para [PRODUCTO/MARCA/SERVICIO] en el sector [INDUSTRIA]. Para cada nombre incluye:
1) El nombre
2) Origen o significado
3) Por qué funciona para esta marca
4) Disponibilidad probable como dominio .com
5) Puntuación del 1 al 10

Agrupa los nombres por estilo: descriptivos, evocadores, abstractos e inventados.

Valores de marca: [DESCRIPCIÓN]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['naming', 'branding', 'identidad', 'creatividad', 'marca', 'dominio'],
  },
  {
    title: 'Generador de Paleta de Marca',
    description: 'Crea una identidad de color coherente y fundamentada para una marca.',
    prompt: `Eres un diseñador de identidad visual y experto en psicología del color. Para la marca [NOMBRE] del sector [INDUSTRIA] con valores [VALORES], genera:
1) Paleta de 5 colores con códigos HEX, RGB y CMYK
2) Justificación psicológica de cada color
3) Combinaciones recomendadas (primario + secundario + acento)
4) Colores a evitar y por qué
5) Aplicación en contextos dark mode y light mode
6) Ejemplos de uso en UI/Branding

Competidores a diferenciarse: [MARCAS]`,
    category: 'other',
    aiTool: 'Claude',
    tags: ['color', 'paleta', 'branding', 'identidad visual', 'psicología del color', 'HEX'],
  },

  // ── PRODUCTIVIDAD / IA ───────────────────────────────────────────────────
  {
    title: 'Optimizador de Prompts',
    description: 'Mejora un prompt existente para hacerlo más preciso, detallado y efectivo.',
    prompt: `Eres un experto en prompt engineering. Analiza el siguiente prompt y genera una versión mejorada que:
1) Defina un rol específico para la IA
2) Aporte contexto relevante
3) Especifique el formato de salida esperado
4) Incluya restricciones claras
5) Agregue ejemplos si aplica

Explica los cambios realizados y por qué mejoran el resultado.

Prompt original: [PROMPT_A_MEJORAR]`,
    category: 'other',
    aiTool: 'Claude',
    tags: ['prompt engineering', 'optimización', 'IA', 'ChatGPT', 'productividad'],
  },
  {
    title: 'Asistente de Reuniones',
    description: 'Transforma notas crudas de una reunión en actas estructuradas y accionables.',
    prompt: `Actúa como un asistente ejecutivo experto. Toma las siguientes notas de reunión y genera un acta profesional que incluya:
1) Resumen ejecutivo (máx. 3 oraciones)
2) Asistentes y roles
3) Temas discutidos
4) Decisiones tomadas
5) Tareas asignadas (con responsable y fecha límite)
6) Próximos pasos

Formato: tabla + texto.

Notas: [NOTAS_DE_REUNIÓN]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['reuniones', 'actas', 'productividad', 'organización', 'tareas', 'seguimiento'],
  },
  {
    title: 'Sintetizador de Documentos Largos',
    description: 'Resume y extrae los puntos clave de documentos, reportes o artículos extensos.',
    prompt: `Eres un analista experto en síntesis de información. Procesa el siguiente documento y entrega:
1) Resumen ejecutivo de 5 oraciones
2) Los 10 puntos clave más importantes (bullets)
3) Datos o cifras destacadas
4) Conclusiones principales
5) Preguntas que el documento deja sin responder

Indica el nivel de confianza de cada punto.

Documento: [TEXTO_O_URL]`,
    category: 'data-analysis',
    aiTool: 'Claude',
    tags: ['resumen', 'síntesis', 'documentos', 'análisis', 'extracción', 'notas'],
  },
  {
    title: 'Creador de SOPs (Procedimientos)',
    description: 'Documenta procesos internos de un negocio como procedimientos operativos estándar.',
    prompt: `Actúa como un consultor de operaciones y procesos. A partir de la siguiente descripción de un proceso, genera un SOP (Standard Operating Procedure) completo con:
1) Objetivo del proceso
2) Alcance y responsables
3) Herramientas necesarias
4) Pasos detallados numerados
5) Puntos de control de calidad
6) Qué hacer si algo falla
7) Glosario de términos clave

Proceso: [DESCRIPCIÓN_DEL_PROCESO]`,
    category: 'text-generation',
    aiTool: 'Claude',
    tags: ['SOP', 'procesos', 'operaciones', 'documentación', 'productividad', 'negocio'],
  },
  {
    title: 'Tutor Personalizado de Aprendizaje',
    description: 'Diseña un plan de aprendizaje estructurado y personalizado para dominar cualquier tema.',
    prompt: `Eres un pedagogo y experto en aprendizaje acelerado. Crea un plan de estudio de [N semanas] para que alguien con nivel [PRINCIPIANTE/INTERMEDIO/AVANZADO] aprenda [TEMA]. Incluye:
1) Objetivos de aprendizaje por semana
2) Recursos recomendados (libros, cursos, videos)
3) Ejercicios prácticos
4) Proyectos de aplicación
5) Criterios para medir progreso

Tiempo disponible: [X horas/semana]
Estilo de aprendizaje: [VISUAL/PRÁCTICO/TEÓRICO]`,
    category: 'other',
    aiTool: 'Claude',
    tags: ['aprendizaje', 'educación', 'plan de estudio', 'tutor', 'habilidades', 'desarrollo personal'],
  },
  {
    title: 'Automatizador de Flujos con IA',
    description: 'Diseña flujos de automatización inteligentes usando herramientas de IA y no-code.',
    prompt: `Eres un experto en automatización con IA y herramientas no-code. Diseña un flujo de automatización para [PROCESO/TAREA] que combine IA generativa con herramientas de automatización. Incluye:
1) Trigger que inicia el flujo
2) Pasos del flujo con herramienta asignada
3) Rol de la IA en el proceso
4) Datos de entrada y salida de cada paso
5) Manejo de errores
6) Estimación de tiempo ahorrado por semana`,
    category: 'other',
    aiTool: 'Make',
    tags: ['automatización', 'no-code', 'Make', 'Zapier', 'n8n', 'flujos', 'IA'],
  },
];

// ─── Script principal ──────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB');

  const User = require('../models/User');
  const Prompt = require('../models/Prompt');

  // Usar el primer admin como autor y moderador
  const admin = await User.findOne({ role: 'admin' }).lean();
  if (!admin) {
    console.error('❌ No se encontró ningún usuario admin. Crea uno primero.');
    process.exit(1);
  }
  console.log(`👤 Usando admin: ${admin.username} (${admin._id})`);

  const now = new Date();
  const docs = PROMPTS.map(p => ({
    ...p,
    author: admin._id,
    status: 'approved',
    moderatedBy: admin._id,
    moderatedAt: now,
    isNSFW: false,
  }));

  const result = await Prompt.insertMany(docs, { ordered: false });
  console.log(`🎉 ${result.length} prompts insertados correctamente.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
