import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  NewspaperIcon,
  PhotoIcon,
  StarIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { blogAPI, promptsAPI, forumsAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Mention {
  kind: 'tool' | 'prompt' | 'community';
  refId: string;
  name: string;
  url?: string;
  category?: string;
  description?: string;
}

const KIND_STYLES = {
  tool:      { label: 'Herramienta', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  prompt:    { label: 'Prompt',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  community: { label: 'Comunidad',   color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const CATEGORIES = [
  { key: 'guide',    label: 'Guide',    color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  Icon: BookOpenIcon,                        desc: 'Guías paso a paso' },
  { key: 'tutorial', label: 'Tutorial', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', Icon: AcademicCapIcon,                     desc: 'Contenido de aprendizaje profundo' },
  { key: 'ranking',  label: 'Ranking',  color: '#059669', bg: 'rgba(5,150,105,0.10)',   Icon: TrophyIcon,                          desc: 'Listas top y comparaciones' },
  { key: 'news',     label: 'News',     color: '#DC2626', bg: 'rgba(220,38,38,0.10)',   Icon: NewspaperIcon,                       desc: 'Novedades de IA y tecnología' },
  { key: 'photo',    label: 'Photo',    color: '#DB2777', bg: 'rgba(219,39,119,0.10)',  Icon: PhotoIcon,                           desc: 'Muestras visuales' },
  { key: 'review',   label: 'Review',   color: '#D97706', bg: 'rgba(217,119,6,0.10)',   Icon: StarIcon,                            desc: 'Reseñas de herramientas IA' },
  { key: 'opinion',  label: 'Opinion',  color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  Icon: ChatBubbleBottomCenterTextIcon,      desc: 'Pensamientos y perspectivas' },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--parchment)' }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: 'var(--dust)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function CreateBlogPost() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    coverImage: '',
    tags: '',
  });
  const [extraImages, setExtraImages] = useState<string[]>(['']);

  // Mentions
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [mentionKind, setMentionKind] = useState<Mention['kind']>('tool');
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [allTools, setAllTools] = useState<any[]>([]);
  const [allForums, setAllForums] = useState<any[]>([]);
  const mentionDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get('/tools').then((r: any) => setAllTools(r.data.tools ?? [])).catch(() => {});
    forumsAPI.getForums().then(d => setAllForums(d.forums ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mentionDebounce.current) clearTimeout(mentionDebounce.current);
    const q = mentionSearch.trim();
    if (!q) { setMentionResults([]); return; }
    mentionDebounce.current = setTimeout(async () => {
      if (mentionKind === 'tool') {
        const ql = q.toLowerCase();
        setMentionResults(allTools.filter(t => t.name.toLowerCase().includes(ql) || t.description?.toLowerCase().includes(ql)).slice(0, 7));
      } else if (mentionKind === 'community') {
        const ql = q.toLowerCase();
        setMentionResults(allForums.filter(f => f.name.toLowerCase().includes(ql) || f.description?.toLowerCase().includes(ql)).slice(0, 7));
      } else {
        setMentionLoading(true);
        try {
          const data = await promptsAPI.getPrompts({ search: q, limit: 7 } as any);
          setMentionResults((data as any).prompts ?? []);
        } catch { setMentionResults([]); }
        finally { setMentionLoading(false); }
      }
    }, 280);
  }, [mentionSearch, mentionKind, allTools, allForums]);

  const addMention = (item: any) => {
    let m: Mention;
    if (mentionKind === 'tool') {
      m = { kind: 'tool', refId: item._id, name: item.name, url: item.url, category: item.category, description: item.description?.slice(0, 120) };
    } else if (mentionKind === 'community') {
      m = { kind: 'community', refId: item._id, name: item.name, url: item.url, category: undefined, description: item.description?.slice(0, 120) };
    } else {
      m = { kind: 'prompt', refId: item._id, name: item.title, url: `/prompt/${item._id}`, category: item.category, description: item.description?.slice(0, 120) };
    }
    if (!mentions.find(x => x.refId === m.refId && x.kind === m.kind)) {
      setMentions(prev => [...prev, m]);
    }
    setMentionSearch('');
    setMentionResults([]);
  };

  const isAdmin = isAuthenticated && ['admin', 'moderator'].includes((user as any)?.role);

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--stone)' }}>
        <p>Necesitas iniciar sesión para escribir un post.</p>
        <Link to="/login" className="btn btn-signal" style={{ marginTop: 16 }}>Iniciar sesión</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--stone)' }}>
        <p style={{ fontSize: 15 }}>Solo administradores y moderadores pueden publicar posts.</p>
        <Link to="/blog" className="btn btn-ghost" style={{ marginTop: 16 }}>Volver al Blog</Link>
      </div>
    );
  }

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error('Por favor selecciona una categoría'); return; }
    if (!form.title.trim()) { toast.error('El título es requerido'); return; }
    if (!form.excerpt.trim()) { toast.error('El resumen es requerido'); return; }
    if (!form.content.trim()) { toast.error('El contenido es requerido'); return; }

    setSubmitting(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const post = await blogAPI.createPost({
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        coverImage: form.coverImage || undefined,
        images: extraImages.map(u => u.trim()).filter(Boolean),
        mentions,
        tags,
      });

      toast.success('¡Post publicado!');
      navigate(`/blog/${post._id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo publicar el post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>

        {/* Back nav */}
        <div style={{ paddingTop: 32, paddingBottom: 32 }}>
          <Link
            to="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--stone)',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--signal)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--stone)')}
          >
            <ArrowLeftIcon style={{ width: 14, height: 14 }} />
            Volver al Blog
          </Link>
        </div>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: 36 }}>
          <span className="mono-label" style={{ marginBottom: 6 }}>Nuevo post</span>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--parchment)', margin: 0 }}>
            Escribe un post
          </h1>
          <p style={{ fontSize: 14, color: 'var(--stone)', marginTop: 6 }}>
            Comparte guías, noticias, opiniones y todo sobre IA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-up stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Category selection */}
          <Field label="Categoría" hint="Requerido">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginTop: 2 }}>
              {CATEGORIES.map(({ key, label, color, bg, Icon, desc }) => {
                const active = form.category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: key }))}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1px solid ${active ? color : 'var(--whisper)'}`,
                      background: active ? bg : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 160ms ease',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: 14, height: 14, color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: active ? color : 'var(--parchment)', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 11, color: 'var(--dust)', margin: 0, marginTop: 2 }}>{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Title */}
          <Field label="Título" hint="Requerido · máx. 200 caracteres">
            <input
              className="input"
              type="text"
              placeholder="Un título interesante y claro..."
              value={form.title}
              onChange={update('title')}
              maxLength={200}
              style={{ fontSize: 15, fontWeight: 500 }}
            />
          </Field>

          {/* Excerpt */}
          <Field label="Resumen" hint="Requerido · resumen corto (máx. 500 caracteres)">
            <textarea
              className="input"
              placeholder="Una breve descripción de lo que trata este post..."
              value={form.excerpt}
              onChange={update('excerpt')}
              maxLength={500}
              rows={3}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>

          {/* Cover image */}
          <Field
            label="Imagen de portada"
            hint="Opcional · pega una URL"
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.coverImage}
                onChange={update('coverImage')}
              />
              <a
                href="https://www.image2url.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ flexShrink: 0, fontSize: 12, gap: 5, whiteSpace: 'nowrap' }}
                title="Upload your image for free on ImgBB and paste the link here"
              >
                <PhotoIcon style={{ width: 14, height: 14 }} />
                Subir imagen
              </a>
            </div>
            {form.coverImage && (
              <div
                style={{
                  marginTop: 10,
                  borderRadius: 8,
                  overflow: 'hidden',
                  height: 160,
                  border: '1px solid var(--whisper)',
                }}
              >
                <img
                  src={form.coverImage}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </Field>

          {/* Additional images */}
          <Field label="Imágenes adicionales" hint="Opcional · hasta 10 imágenes">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {extraImages.map((url, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      type="url"
                      placeholder={`https://example.com/image-${i + 1}.jpg`}
                      value={url}
                      onChange={e => {
                        const next = [...extraImages];
                        next[i] = e.target.value;
                        setExtraImages(next);
                      }}
                      style={{ flex: 1 }}
                    />
                    {extraImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setExtraImages(imgs => imgs.filter((_, j) => j !== i))}
                        style={{
                          flexShrink: 0, width: 36, height: 36,
                          border: '1px solid var(--whisper)', borderRadius: 6,
                          background: 'transparent', cursor: 'pointer',
                          color: 'var(--stone)', fontSize: 16, lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'color 150ms, border-color 150ms',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--destructive)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--destructive)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--stone)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--whisper)'; }}
                        title="Remove image"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {url.trim() && (
                    <div style={{ borderRadius: 8, overflow: 'hidden', height: 140, border: '1px solid var(--whisper)' }}>
                      <img
                        src={url}
                        alt={`Image ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              ))}
              {extraImages.length < 10 && (
                <button
                  type="button"
                  onClick={() => setExtraImages(imgs => [...imgs, ''])}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 14px', borderRadius: 6, width: 'fit-content',
                    border: '1px dashed var(--whisper)', background: 'transparent',
                    color: 'var(--stone)', fontSize: 13, cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--signal)'; (e.currentTarget as HTMLElement).style.color = 'var(--signal)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--whisper)'; (e.currentTarget as HTMLElement).style.color = 'var(--stone)'; }}
                >
                  <PhotoIcon style={{ width: 14, height: 14 }} />
                  + Agregar imagen
                </button>
              )}
            </div>
          </Field>

          {/* Mentions */}
          <Field label="Menciones" hint="Opcional · herramientas, prompts o comunidades">
            {/* Kind tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['tool', 'prompt', 'community'] as const).map(k => {
                const s = KIND_STYLES[k];
                const active = mentionKind === k;
                return (
                  <button key={k} type="button" onClick={() => { setMentionKind(k); setMentionSearch(''); setMentionResults([]); }}
                    style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 140ms',
                      border: active ? `1px solid ${s.color}` : '1px solid var(--whisper)',
                      background: active ? s.bg : 'transparent',
                      color: active ? s.color : 'var(--stone)',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <MagnifyingGlassIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--stone)', opacity: 0.5 }} />
              <input
                className="input"
                type="text"
                placeholder={`Buscar ${KIND_STYLES[mentionKind].label.toLowerCase()}...`}
                value={mentionSearch}
                onChange={e => setMentionSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />

              {/* Dropdown results */}
              {(mentionResults.length > 0 || mentionLoading) && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                  background: 'var(--carbon)', border: '1px solid var(--whisper)', borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden',
                }}>
                  {mentionLoading ? (
                    <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--stone)', textAlign: 'center' }}>Buscando...</div>
                  ) : mentionResults.map((item, i) => {
                    const name = item.title ?? item.name;
                    const alreadyAdded = mentions.some(m => m.refId === item._id && m.kind === mentionKind);
                    return (
                      <button key={i} type="button" onClick={() => addMention(item)} disabled={alreadyAdded}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '10px 14px', border: 'none', background: 'none', cursor: alreadyAdded ? 'default' : 'pointer',
                          borderBottom: i < mentionResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          textAlign: 'left', transition: 'background 120ms', opacity: alreadyAdded ? 0.45 : 1,
                        }}
                        onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--parchment)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                          {item.category && <p style={{ margin: 0, fontSize: 11, color: 'var(--stone)' }}>{item.category}</p>}
                        </div>
                        {alreadyAdded && <span style={{ fontSize: 10, color: 'var(--stone)', flexShrink: 0 }}>ya agregado</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Added mentions */}
            {mentions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {mentions.map((m, i) => {
                  const s = KIND_STYLES[m.kind];
                  return (
                    <div key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 6,
                      border: `1px solid ${s.color}44`, background: s.bg,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--parchment)' }}>{m.name}</span>
                      <button type="button" onClick={() => setMentions(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--stone)', transition: 'color 120ms' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--destructive)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--stone)'}
                      >
                        <XMarkIcon style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Field>

          {/* Tags */}
          <Field label="Etiquetas" hint="Opcional · separadas por coma">
            <input
              className="input"
              type="text"
              placeholder="chatgpt, prompting, tips"
              value={form.tags}
              onChange={update('tags')}
            />
          </Field>

          {/* Content */}
          <Field label="Contenido" hint="Requerido">
            <textarea
              className="input"
              placeholder="Escribe tu post aquí. Puedes usar saltos de línea para párrafos."
              value={form.content}
              onChange={update('content')}
              rows={20}
              style={{ resize: 'vertical', lineHeight: 1.75, fontSize: 15, minHeight: 380, fontFamily: 'Inter, sans-serif' }}
            />
            <span style={{ fontSize: 11, color: 'var(--dust)', alignSelf: 'flex-end' }}>
              {form.content.trim().split(/\s+/).filter(Boolean).length} palabras ·{' '}
              ~{Math.max(1, Math.ceil(form.content.trim().split(/\s+/).filter(Boolean).length / 200))} min de lectura
            </span>
          </Field>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-signal"
              style={{ gap: 7, opacity: submitting ? 0.65 : 1 }}
            >
              {submitting ? (
                <><div className="spinner" style={{ width: 14, height: 14 }} /> Publicando...</>
              ) : (
                <><PaperAirplaneIcon style={{ width: 15, height: 15 }} /> Publicar post</>
              )}
            </button>
            <Link to="/blog" className="btn btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
