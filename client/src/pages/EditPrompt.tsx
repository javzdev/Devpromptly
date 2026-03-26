import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  PhotoIcon,
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

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--stone)', marginBottom: 6 }}>{children}</label>
);

const EditPrompt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt: '',
    category: 'text-generation' as PromptCategory,
    aiTool: 'ChatGPT' as AITool,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const categories: { value: PromptCategory; label: string }[] = [
    { value: 'text-generation', label: 'Writing & Text' },
    { value: 'image-generation', label: 'Art & Images' },
    { value: 'code-generation', label: 'Code & Dev' },
    { value: 'audio-generation', label: 'Music & Audio' },
    { value: 'video-generation', label: 'Video & Motion' },
    { value: 'data-analysis', label: 'Data & Analytics' },
    { value: 'translation', label: 'Translation' },
    { value: 'other', label: 'Other' },
  ];

  const aiTools: { value: AITool; label: string; group: string }[] = [
    { value: 'ChatGPT',    label: 'ChatGPT',    group: 'Text & Chat' },
    { value: 'Claude',     label: 'Claude',     group: 'Text & Chat' },
    { value: 'Gemini',     label: 'Gemini',     group: 'Text & Chat' },
    { value: 'Grok',       label: 'Grok',       group: 'Text & Chat' },
    { value: 'Perplexity', label: 'Perplexity', group: 'Text & Chat' },
    { value: 'Llama',      label: 'Llama',      group: 'Text & Chat' },
    { value: 'Mistral',    label: 'Mistral',    group: 'Text & Chat' },
    { value: 'DeepSeek',   label: 'DeepSeek',   group: 'Text & Chat' },
    { value: 'Midjourney',       label: 'Midjourney',       group: 'Image' },
    { value: 'DALL-E',           label: 'DALL-E',           group: 'Image' },
    { value: 'Stable Diffusion', label: 'Stable Diffusion', group: 'Image' },
    { value: 'Flux',             label: 'Flux',             group: 'Image' },
    { value: 'Firefly',          label: 'Firefly',          group: 'Image' },
    { value: 'Ideogram',         label: 'Ideogram',         group: 'Image' },
    { value: 'Leonardo AI',      label: 'Leonardo AI',      group: 'Image' },
    { value: 'GitHub Copilot', label: 'GitHub Copilot', group: 'Code' },
    { value: 'Cursor',         label: 'Cursor',         group: 'Code' },
    { value: 'CodeLlama',      label: 'CodeLlama',      group: 'Code' },
    { value: 'Tabnine',        label: 'Tabnine',        group: 'Code' },
    { value: 'Codeium',        label: 'Codeium',        group: 'Code' },
    { value: 'Jasper',     label: 'Jasper',     group: 'Writing' },
    { value: 'Copy.ai',    label: 'Copy.ai',    group: 'Writing' },
    { value: 'Writesonic', label: 'Writesonic', group: 'Writing' },
    { value: 'Sora',       label: 'Sora',       group: 'Video & Audio' },
    { value: 'Runway',     label: 'Runway',     group: 'Video & Audio' },
    { value: 'ElevenLabs', label: 'ElevenLabs', group: 'Video & Audio' },
    { value: 'Udio',       label: 'Udio',       group: 'Video & Audio' },
    { value: 'Suno',       label: 'Suno',       group: 'Video & Audio' },
    { value: 'Other', label: 'Other — especificar', group: 'Other' },
  ];

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await promptsAPI.getPrompt(id);
        const p = data.prompt;
        // Verify ownership
        const authorId = typeof p.author === 'object' ? (p.author as any)._id : p.author;
        if (authorId !== user?._id) {
          toast.error('No tienes permiso para editar este prompt');
          navigate('/my-prompts');
          return;
        }
        setFormData({
          title: p.title,
          description: p.description,
          prompt: p.prompt,
          category: p.category,
          aiTool: p.aiTool,
          tags: p.tags || [],
        });
        setExistingImages(p.images || []);
      } catch {
        toast.error('Error al cargar el prompt');
        navigate('/my-prompts');
      } finally {
        setIsFetching(false);
      }
    })();
  }, [id, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (t: string) =>
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCurrent = existingImages.length + newImageFiles.length;
    const remaining = 2 - totalCurrent;
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) toast.error(`Solo puedes agregar ${remaining} imagen${remaining === 1 ? '' : 'es'} más`);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    setNewImageFiles(prev => [...prev, ...toAdd]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('El título es requerido'); return; }
    if (!formData.description.trim()) { toast.error('La descripción es requerida'); return; }
    if (!formData.prompt.trim()) { toast.error('El contenido del prompt es requerido'); return; }
    if (formData.tags.length === 0) { toast.error('Agrega al menos una etiqueta'); return; }
    if (!id) return;

    setIsLoading(true);
    try {
      await promptsAPI.updatePrompt(
        id,
        formData,
        newImageFiles.length > 0 ? newImageFiles : undefined,
        existingImages
      );
      toast.success('Prompt actualizado — pendiente de revisión');
      navigate('/my-prompts');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar el prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const charPct = formData.prompt.length / 5000;

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '70vh', background: 'var(--void)', gap: 16 }}>
        <div className="spinner" />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.12em' }}>LOADING</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link to="/my-prompts" className="flex items-center gap-1.5 nav-link" style={{ display: 'inline-flex', marginBottom: 20, fontSize: 12 }}>
            <ChevronLeftIcon style={{ width: 13, height: 13 }} />
            Mis Prompts
          </Link>
          <span className="mono-label" style={{ marginBottom: 8 }}>Editar</span>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.03em' }}>
            Editar prompt
          </h1>
          <p style={{ fontSize: 14, color: 'var(--stone)', marginTop: 8 }}>
            Al guardar, el prompt volverá a revisión pendiente.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section 1: Basic Info */}
          <div className="card" style={{ padding: '24px' }}>
            <S n="01" title="Información Básica" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Label>Título</Label>
                <input name="title" type="text" required value={formData.title} onChange={handleChange}
                  placeholder="ej. Creador de Emails Profesionales"
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
                  <Label>Categoría</Label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    className="input" style={{ appearance: 'none', cursor: 'pointer', fontSize: 12 }}>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value} style={{ background: '#1A1A1E' }}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Herramienta IA</Label>
                  <select name="aiTool" value={formData.aiTool} onChange={handleChange}
                    className="input" style={{ appearance: 'none', cursor: 'pointer', fontSize: 12 }}>
                    {['Text & Chat', 'Image', 'Code', 'Writing', 'Video & Audio', 'Other'].map((group) => (
                      <optgroup key={group} label={group} style={{ background: '#1A1A1E', color: 'var(--stone)' }}>
                        {aiTools.filter((t) => t.group === group).map((t) => (
                          <option key={t.value} value={t.value} style={{ background: '#1A1A1E' }}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
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
              placeholder="Pega tu prompt optimizado aquí…"
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

          {/* Section 3: Tags */}
          <div className="card" style={{ padding: '24px' }}>
            <S n="03" title="Etiquetas" />
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags.map((tag) => (
                <div key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--signal-dim)', border: '1px solid rgba(232,184,75,0.25)',
                  borderRadius: 'var(--r-xs)', padding: '3px 10px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--signal)',
                }}>
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--signal)', opacity: 0.7, display: 'flex' }}>
                    <XMarkIcon style={{ width: 11, height: 11 }} />
                  </button>
                </div>
              ))}
              {formData.tags.length < 10 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Agregar etiqueta…"
                    className="input"
                    style={{ width: 160, fontSize: 12, padding: '6px 12px' }}
                  />
                  <button type="button" onClick={addTag} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
                    <PlusIcon style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.5 }}>
              Agrega hasta 10 etiquetas · {formData.tags.length}/10 usadas
            </p>
          </div>

          {/* Section 4: Reference Images */}
          <div className="card" style={{ padding: '24px' }}>
            <S n="04" title="Imágenes de Referencia" />
            <p style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.6, marginBottom: 16 }}>
              Opcional · Hasta 2 imágenes que muestren el resultado del prompt. JPG, PNG, WebP, GIF · Máx. 5MB.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {existingImages.map((url, i) => (
                <div key={`ex-${i}`} style={{ position: 'relative', width: 140, height: 100, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--whisper)', flexShrink: 0 }}>
                  <img src={url} alt={`Existente ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeExistingImage(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XMarkIcon style={{ width: 12, height: 12, color: '#fff' }} />
                  </button>
                </div>
              ))}
              {newImagePreviews.map((src, i) => (
                <div key={`new-${i}`} style={{ position: 'relative', width: 140, height: 100, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--whisper)', flexShrink: 0 }}>
                  <img src={src} alt={`Nueva ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XMarkIcon style={{ width: 12, height: 12, color: '#fff' }} />
                  </button>
                </div>
              ))}
              {existingImages.length + newImageFiles.length < 2 && (
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  style={{ width: 140, height: 100, borderRadius: 'var(--r-sm)', border: '1px dashed var(--whisper)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0, transition: 'border-color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--signal)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--whisper)')}>
                  <PhotoIcon style={{ width: 24, height: 24, color: 'var(--stone)', opacity: 0.4 }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5 }}>+ Agregar imagen</span>
                </button>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between" style={{ paddingTop: 8 }}>
            <Link to="/my-prompts" className="btn btn-ghost" style={{ fontSize: 12 }}>Cancelar</Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-signal"
              style={{ gap: 8, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <><div className="spinner" style={{ width: 13, height: 13 }} />Guardando…</>
              ) : (
                <><CheckIcon style={{ width: 14, height: 14 }} />Guardar cambios</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPrompt;
