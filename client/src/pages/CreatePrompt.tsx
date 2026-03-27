import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  SparklesIcon,
  CheckIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { promptsAPI } from '../services/api';
import { PromptCategory, AITool } from '../types';
import toast from 'react-hot-toast';

const S: React.FC<{ n: string; title: string }> = ({ n, title }) => (
  <div className="flex items-center gap-3 mb-6">
    <div style={{
      width: 28, height: 28, borderRadius: 'var(--r-xs)',
      background: 'var(--signal-dim)', border: '1px solid rgba(232,184,75,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--signal)',
    }}>{n}</div>
    <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--parchment)', letterSpacing: '-0.02em' }}>{title}</h2>
  </div>
);

const Label: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink)', marginBottom: 6, ...style }}>{children}</label>
);

const CreatePrompt: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt: '',
    category: 'text-generation' as PromptCategory,
    aiTool: 'ChatGPT' as AITool,
    tags: [] as string[],
    isNSFW: false,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customAiTool, setCustomAiTool] = useState('');

  const PREDEFINED_TAGS = [
    'creative-writing', 'coding', 'marketing', 'productivity', 'chatbot',
    'roleplay', 'summarize', 'brainstorming', 'email', 'seo',
    'education', 'research', 'social-media', 'debugging', 'translation',
    'business', 'data-analysis', 'storytelling', 'humor', 'nsfw',
  ];

  const categories: { value: PromptCategory; label: string }[] = [
    { value: 'text-generation', label: 'Escritura y Texto' },
    { value: 'image-generation', label: 'Arte e Imágenes' },
    { value: 'code-generation', label: 'Código y Desarrollo' },
    { value: 'audio-generation', label: 'Música y Audio' },
    { value: 'video-generation', label: 'Video y Movimiento' },
    { value: 'data-analysis', label: 'Datos y Análisis' },
    { value: 'translation', label: 'Traducción' },
    
  ];

  const aiTools: { value: AITool; label: string; group: string }[] = [
    // Text & Chat
    { value: 'ChatGPT',    label: 'ChatGPT',    group: 'Text & Chat' },
    { value: 'Claude',     label: 'Claude',     group: 'Text & Chat' },
    { value: 'Gemini',     label: 'Gemini',     group: 'Text & Chat' },
    { value: 'Grok',       label: 'Grok',       group: 'Text & Chat' },
    { value: 'Perplexity', label: 'Perplexity', group: 'Text & Chat' },
    { value: 'Llama',      label: 'Llama',      group: 'Text & Chat' },
    { value: 'Mistral',    label: 'Mistral',    group: 'Text & Chat' },
    { value: 'DeepSeek',   label: 'DeepSeek',   group: 'Text & Chat' },
    // Image
    { value: 'Midjourney',     label: 'Midjourney',     group: 'Image' },
    { value: 'DALL-E',         label: 'DALL-E',         group: 'Image' },
    { value: 'Stable Diffusion', label: 'Stable Diffusion', group: 'Image' },
    { value: 'Flux',           label: 'Flux',           group: 'Image' },
    { value: 'Firefly',        label: 'Firefly',        group: 'Image' },
    { value: 'Ideogram',       label: 'Ideogram',       group: 'Image' },
    { value: 'Leonardo AI',    label: 'Leonardo AI',    group: 'Image' },
    // Code
    { value: 'GitHub Copilot', label: 'GitHub Copilot', group: 'Code' },
    { value: 'Cursor',         label: 'Cursor',         group: 'Code' },
    { value: 'CodeLlama',      label: 'CodeLlama',      group: 'Code' },
    { value: 'Tabnine',        label: 'Tabnine',        group: 'Code' },
    { value: 'Codeium',        label: 'Codeium',        group: 'Code' },
    // Writing
    { value: 'Jasper',      label: 'Jasper',      group: 'Writing' },
    { value: 'Copy.ai',     label: 'Copy.ai',     group: 'Writing' },
    { value: 'Writesonic',  label: 'Writesonic',  group: 'Writing' },
    // Video & Audio
    { value: 'Sora',        label: 'Sora',        group: 'Video & Audio' },
    { value: 'Runway',      label: 'Runway',      group: 'Video & Audio' },
    { value: 'ElevenLabs',  label: 'ElevenLabs',  group: 'Video & Audio' },
    { value: 'Udio',        label: 'Udio',        group: 'Video & Audio' },
    { value: 'Suno',        label: 'Suno',        group: 'Video & Audio' },
    // Other
    { value: 'Other', label: 'Otro — especificar', group: 'Otro' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => {
      const has = prev.tags.includes(tag);
      if (has) return { ...prev, tags: prev.tags.filter((t) => t !== tag) };
      if (prev.tags.length >= 10) { toast.error('Máximo 10 etiquetas'); return prev; }
      return { ...prev, tags: [...prev.tags, tag] };
    });
  };

  const addCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    if (formData.tags.includes(tag)) { toast.error('Tag ya agregado'); return; }
    if (formData.tags.length >= 10) { toast.error('Máximo 10 etiquetas'); return; }
    if (tag.length > 30) { toast.error('Tag muy largo (máx 30 caracteres)'); return; }
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setCustomTagInput('');
  };

  const loadTemplate = async () => {
    setIsGenerating(true);
    const templates: Record<string, { title: string; description: string; prompt: string }> = {
      'text-generation': {
        title: 'Redactor de Emails Profesionales',
        description: 'Genera emails profesionales para cualquier situación de negocio',
        prompt: 'Escribe un email profesional para la siguiente situación:\n\nDestinatario: [nombre/cargo del destinatario]\nObjetivo: [propósito del email]\nPuntos clave: [puntos principales a comunicar]\nTono: [formal/casual/urgente]\n\nIncluye un asunto claro, saludo apropiado, cuerpo estructurado y cierre profesional.',
      },
      'code-generation': {
        title: 'Generador de Componentes React',
        description: 'Genera componentes React con TypeScript listos para usar',
        prompt: 'Crea un componente React con TypeScript:\n\nNombre: [nombre del componente]\nPropósito: [qué hace el componente]\nProps: [lista de props con sus tipos]\nFuncionalidades: [funcionalidades necesarias]\nEstilos: [Tailwind/CSS]\n\nIncluye interfaces TypeScript, manejadores de eventos y atributos de accesibilidad.',
      },
      'image-generation': {
        title: 'Generador de Retratos de Fantasía',
        description: 'Crea retratos detallados de personajes de fantasía',
        prompt: 'Retrato de personaje de fantasía:\n\nPersonaje: [tipo de personaje]\nRaza: [humano/elfo/etc]\nEntorno: [ambiente o escenario]\nEstado de ánimo: [heroico/misterioso]\nEstilo: [realista/pintado]\n\nIncluye ropa detallada, accesorios y fondo acorde al personaje.',
      },
      'audio-generation': {
        title: 'Compositor de Letras Musicales',
        description: 'Genera letras de canciones originales para cualquier género musical',
        prompt: 'Compón una letra de canción con las siguientes características:\n\nGénero: [pop/rock/reggaetón/etc]\nTema: [amor/desamor/motivación/etc]\nTono: [alegre/melancólico/enérgico]\nEstructura: [verso/coro/puente]\n\nIncluye rimas naturales, metáforas y una melodía que fluya con el ritmo del género.',
      },
      'video-generation': {
        title: 'Director de Escenas Cinematográficas',
        description: 'Genera descripciones detalladas de escenas para videos con IA',
        prompt: 'Describe una escena cinematográfica para generar con IA:\n\nTipo de plano: [primer plano/plano general/etc]\nEscenario: [lugar y ambiente]\nPersonajes: [descripción visual]\nMovimiento de cámara: [estático/paneo/zoom]\nIluminación: [natural/dramática/cálida]\n\nIncluye detalles de atmósfera, paleta de colores y duración aproximada.',
      },
      'data-analysis': {
        title: 'Analista de Datos con IA',
        description: 'Analiza conjuntos de datos y extrae insights relevantes',
        prompt: 'Analiza el siguiente conjunto de datos y proporciona insights:\n\nDatos: [descripción o muestra de los datos]\nObjetivo del análisis: [qué quieres descubrir]\nMétricas clave: [KPIs o variables importantes]\nFormato de salida: [tabla/resumen/visualización]\n\nIdentifica tendencias, anomalías y recomendaciones accionables.',
      },
      'translation': {
        title: 'Traductor Profesional Contextual',
        description: 'Traduce textos manteniendo el contexto, tono y matices culturales',
        prompt: 'Traduce el siguiente texto de manera profesional:\n\nIdioma origen: [idioma del texto]\nIdioma destino: [idioma al que traducir]\nContexto: [ámbito: legal/médico/marketing/informal]\nTono: [formal/casual/técnico]\nTexto: [texto a traducir]\n\nMantén el significado original, adapta expresiones idiomáticas y conserva el tono del autor.',
      },
      'other': {
        title: 'Asistente de Productividad Personal',
        description: 'Organiza tareas, ideas y proyectos de forma eficiente',
        prompt: 'Ayúdame a organizar y planificar lo siguiente:\n\nTarea o proyecto: [descripción]\nPlazos: [fechas límite]\nRecursos disponibles: [tiempo/personas/herramientas]\nPrioridad: [alta/media/baja]\n\nCrea un plan de acción paso a paso con tiempos estimados y posibles obstáculos a considerar.',
      },
    };
    await new Promise((r) => setTimeout(r, 600));
    const t = templates[formData.category] || templates['text-generation'];
    setFormData((prev) => ({ ...prev, ...t }));
    setIsGenerating(false);
    toast.success('Plantilla cargada');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 2 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) toast.error(`Solo puedes agregar ${remaining} imagen${remaining === 1 ? '' : 'es'} más`);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    setImageFiles(prev => [...prev, ...toAdd]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('El título es requerido'); return; }
    if (!formData.description.trim()) { toast.error('La descripción es requerida'); return; }
    if (!formData.prompt.trim()) { toast.error('El contenido del prompt es requerido'); return; }
    if (formData.aiTool === 'Other' && !customAiTool.trim()) { toast.error('Especifica la herramienta de IA'); return; }
    if (!user) { toast.error('Por favor inicia sesión'); navigate('/login'); return; }
    if (!user.emailVerified) { toast.error('Verifica tu correo electrónico para publicar prompts'); return; }

    setIsLoading(true);
    try {
      // If "Other", include the custom tool name as a tag so it's searchable
      const payload = {
        ...formData,
        tags: formData.aiTool === 'Other' && customAiTool.trim()
          ? Array.from(new Set([...formData.tags, customAiTool.trim().toLowerCase().replace(/\s+/g, '-')]))
          : formData.tags,
      };
      await promptsAPI.createPrompt(payload, imageFiles.length > 0 ? imageFiles : undefined);
      toast.success(formData.isNSFW ? 'Prompt enviado a revisión' : 'Prompt publicado');
      navigate('/my-prompts');
    } catch { toast.error('Error al crear el prompt'); }
    finally { setIsLoading(false); }
  };

  const charPct = formData.prompt.length / 5000;

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link to="/prompts" className="flex items-center gap-1.5 nav-link" style={{ display: 'inline-flex', marginBottom: 20, fontSize: 12 }}>
            <ChevronLeftIcon style={{ width: 13, height: 13 }} />
            Volver
          </Link>
          <span className="mono-label" style={{ marginBottom: 8 }}>Crear</span>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.03em' }}>
            Comparte tu prompt
          </h1>
          <p style={{ fontSize: 14, color: 'var(--stone)', marginTop: 8 }}>
            Contribuye una plantilla de prompt de calidad a la comunidad.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section 1: Basic Info */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-6">
              <S n="01" title="Información Básica" />
              <button
                type="button"
                onClick={loadTemplate}
                disabled={isGenerating}
                className="flex items-center gap-2 nav-link"
                style={{ fontSize: 12, color: 'var(--signal)', opacity: isGenerating ? 0.5 : 1 }}
              >
                {isGenerating ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <SparklesIcon style={{ width: 13, height: 13 }} />}
                {isGenerating ? 'Cargando…' : 'Cargar plantilla'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Label>Título</Label>
                <input name="title" type="text" required value={formData.title} onChange={handleChange}
                  placeholder="ej. Redactor de Emails Profesionales"
                  className="input" style={{ fontSize: 13 }} />
              </div>

              <div>
                <Label>Descripción corta</Label>
                <textarea name="description" required value={formData.description} onChange={handleChange}
                  rows={2} placeholder="Un resumen de lo que logra este prompt…"
                  className="input" style={{ resize: 'none', fontSize: 13 }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: "#000000" }}>Categoría</Label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    className="input" style={{ appearance: 'none', cursor: 'pointer', fontSize: 12,  }}>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value} style={{ background: 'var(--carbon)' }}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label style={{ color: "#000000" }}>Herramienta IA</Label>
                  <select name="aiTool" value={formData.aiTool} onChange={handleChange}
                    className="input" style={{ appearance: 'none', cursor: 'pointer', fontSize: 12 }}>
                    {['Text & Chat', 'Image', 'Code', 'Writing', 'Video & Audio', 'Other'].map((group) => (
                      <optgroup key={group} label={group} style={{ background: 'var(--carbon)', color: 'var(--stone)' }}>
                        {aiTools.filter((t) => t.group === group).map((t) => (
                          <option key={t.value} value={t.value} style={{ background: 'var(--carbon)' }}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {formData.aiTool === 'Other' && (
                    <input
                      type="text"
                      value={customAiTool}
                      onChange={(e) => setCustomAiTool(e.target.value)}
                      placeholder="¿Cuál herramienta?"
                      className="input"
                      style={{ marginTop: 8, fontSize: 12 }}
                      maxLength={50}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Prompt */}
          <div className="card" style={{ padding: '24px' }}>
            <S n="02" title="Contenido del Prompt" />
            <textarea
              name="prompt"
              required
              value={formData.prompt}
              onChange={handleChange}
              rows={12}
              placeholder="Pega tu prompt optimizado aquí…&#10;&#10;Tip: Usa [corchetes] para variables"
              style={{
                width: '100%', background: 'var(--void)', border: '1px solid var(--whisper)',
                borderRadius: 'var(--r-sm)', padding: '14px 16px',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--stone)',
                lineHeight: 1.75, resize: 'vertical', minHeight: 240, outline: 'none',
                transition: 'border-color 160ms, box-shadow 160ms',
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--signal)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px var(--signal-dim)'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--whisper)'; (e.target as HTMLElement).style.boxShadow = 'none'; }}
            />
            <div className="flex items-center justify-between mt-3">
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.4, letterSpacing: '0.08em' }}>
                Usa [corchetes] para variables
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: charPct > 0.9 ? 'var(--signal)' : 'var(--stone)', opacity: charPct > 0.9 ? 1 : 0.4 }}>
                {formData.prompt.length} / 5000
              </span>
            </div>
          </div>

          {/* Section 3: Tags & NSFW */}
          <div className="card" style={{ padding: '24px' }}>
            <S n="03" title="Etiquetas" />
            <p style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.6, marginBottom: 14 }}>
              Selecciona hasta 10 etiquetas · {formData.tags.length}/10 seleccionadas
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {PREDEFINED_TAGS.map((tag) => {
                const selected = formData.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: selected ? 'var(--signal-dim)' : 'transparent',
                      border: `1px solid ${selected ? 'rgba(232,184,75,0.5)' : 'var(--whisper)'}`,
                      borderRadius: 'var(--r-xs)', padding: '4px 12px', cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                      color: selected ? 'var(--signal)' : 'var(--stone)',
                      transition: 'all 120ms',
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Custom tag input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                placeholder="Tag personalizado…"
                className="input"
                style={{ flex: 1, fontSize: 12, padding: '6px 12px' }}
                maxLength={30}
              />
              <button type="button" onClick={addCustomTag} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}>
                + Agregar
              </button>
            </div>

            {/* NSFW toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: formData.isNSFW ? 'rgba(239,68,68,0.08)' : 'var(--void)',
              border: `1px solid ${formData.isNSFW ? 'rgba(239,68,68,0.35)' : 'var(--whisper)'}`,
              borderRadius: 'var(--r-sm)', padding: '14px 16px',
              transition: 'all 160ms',
            }}>
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon style={{ width: 16, height: 16, color: formData.isNSFW ? '#ef4444' : 'var(--stone)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: formData.isNSFW ? '#ef4444' : 'var(--parchment)', marginBottom: 2 }}>
                    Contenido NSFW
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.7 }}>
                    Marca este prompt como contenido para adultos. Solo visible para usuarios que lo activen en sus ajustes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isNSFW: !prev.isNSFW }))}
                style={{
                  flexShrink: 0, width: 40, height: 22, borderRadius: 11,
                  background: formData.isNSFW ? '#ef4444' : 'var(--whisper)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 160ms',
                }}
                aria-label="Toggle NSFW"
              >
                <span style={{
                  position: 'absolute', top: 3, left: formData.isNSFW ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 160ms',
                }} />
              </button>
            </div>
          </div>

          {/* Section 4: Reference Images */}
          <div className="card" style={{ padding: '24px' }}>
            <S n="04" title="Imágenes de Referencia" />
            <p style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.6, marginBottom: 16 }}>
              Opcional · Agrega hasta 2 imágenes que muestren el resultado de usar este prompt. Formatos: JPG, PNG, WebP, GIF · Máx. 5MB cada una.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {imagePreviews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 140, height: 100, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--whisper)', flexShrink: 0 }}>
                  <img src={src} alt={`Referencia ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: 4, right: 4, width: 20, height: 20,
                      borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <XMarkIcon style={{ width: 12, height: 12, color: '#fff' }} />
                  </button>
                </div>
              ))}

              {imageFiles.length < 2 && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    width: 140, height: 100, borderRadius: 'var(--r-sm)',
                    border: '1px dashed var(--whisper)', background: 'transparent',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'border-color 150ms',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--signal)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--whisper)')}
                >
                  <PhotoIcon style={{ width: 24, height: 24, color: 'var(--stone)', opacity: 0.4 }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5 }}>
                    + Agregar imagen
                  </span>
                </button>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between" style={{ paddingTop: 8 }}>
            <Link to="/prompts" className="btn btn-ghost" style={{ fontSize: 12 }}>Cancelar</Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-signal"
              style={{ gap: 8, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <><div className="spinner" style={{ width: 13, height: 13 }} />Publicando…</>
              ) : (
                <><CheckIcon style={{ width: 14, height: 14 }} />Compartir prompt</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePrompt;
