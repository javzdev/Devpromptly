import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HeartIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  TagIcon,
  ChevronLeftIcon,
  CheckIcon,
  SparklesIcon,
  FlagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { promptsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Prompt } from '../types';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'misleading', label: 'Información engañosa' },
  { value: 'copyright', label: 'Violación de derechos de autor' },
  { value: 'other', label: 'Otro' },
];

const PromptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (id) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await promptsAPI.getPrompt(id!);
      setPrompt(res.prompt);
      if (user) setIsFavorited(user.favorites.includes(id!));
    } catch { toast.error('Failed to load prompt'); }
    finally { setLoading(false); }
  };

  const handleRating = async (rating: number) => {
    if (!user) { toast.error('Inicia sesión para valorar'); return; }
    if (userRating > 0) { toast.error('Ya valorado'); return; }
    try {
      const res = await promptsAPI.ratePrompt(id!, rating);
      setUserRating(rating);
      if (prompt) setPrompt({ ...prompt, ratings: { ...prompt.ratings, average: res.averageRating, count: res.totalRatings } });
      toast.success('Valoración guardada');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error al guardar valoración'); }
  };

  const handleFavorite = async () => {
    if (!user) { toast.error('Inicia sesión'); return; }
    try {
      const res = await promptsAPI.toggleFavorite(id!);
      setIsFavorited(res.favorited);
      if (prompt) setPrompt({ ...prompt, favorites: res.favoritesCount });
      toast.success(res.favorited ? 'Guardado en favoritos' : 'Eliminado de favoritos');
    } catch { toast.error('Error al actualizar'); }
  };

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Error al copiar'); }
  };

  const handleReport = async () => {
    if (!reportReason) { toast.error('Selecciona un motivo'); return; }
    setReportSubmitting(true);
    try {
      await promptsAPI.reportPrompt(id!, reportReason, reportDetails);
      toast.success('Reporte enviado — lo revisaremos pronto');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar el reporte');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!prompt) return;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: prompt.title, text: prompt.description, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '70vh', background: 'var(--void)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.12em' }}>LOADING</span>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-4" style={{ minHeight: '70vh', background: 'var(--void)' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--parchment)', marginBottom: 8 }}>Prompt no encontrado</h2>
        <p style={{ fontSize: 13, color: 'var(--stone)', marginBottom: 20 }}>No pudimos encontrar el prompt que buscas.</p>
        <Link to="/prompts" className="btn btn-ghost">Explorar todos los prompts</Link>
      </div>
    );
  }

  const author = typeof prompt.author === 'object' ? prompt.author : null;

  const Stars: React.FC<{ value: number; interactive?: boolean }> = ({ value, interactive = false }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= (interactive ? (hoverRating || userRating || value) : value);
        return (
          <button
            key={s}
            disabled={!interactive || userRating > 0}
            onClick={() => interactive && handleRating(s)}
            onMouseEnter={() => interactive && !userRating && setHoverRating(s)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            style={{ background: 'none', border: 'none', cursor: interactive && !userRating ? 'pointer' : 'default', padding: 1, transition: 'transform 100ms' }}
          >
            <StarIcon style={{ width: 16, height: 16, color: filled ? 'var(--signal)' : 'var(--graphite)', transition: 'color 100ms' }} />
          </button>
        );
      })}
    </div>
  );

  const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
      <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', opacity: 0.5, marginBottom: 4 }}>{label}</span>
      <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        {/* Back */}
        <Link to="/prompts" className="flex items-center gap-1.5 nav-link" style={{ display: 'inline-flex', marginBottom: 28, fontSize: 12 }}>
          <ChevronLeftIcon style={{ width: 13, height: 13 }} />
          Volver a prompts
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — main content */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div className="animate-fade-up">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="chip">{prompt.category.replace(/-/g, ' ')}</span>
                <span className="chip chip-signal">{prompt.aiTool}</span>
                {prompt.featured && (
                  <span className="chip chip-signal">
                    <SparklesIcon style={{ width: 10, height: 10, marginRight: 4 }} />
                    Featured
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
                {prompt.title}
              </h1>
              <p style={{ fontSize: 15, color: 'var(--stone)', lineHeight: 1.7 }}>{prompt.description}</p>
            </div>

            {/* Prompt box */}
            <div className="card animate-fade-up" style={{ padding: 0, animationDelay: '60ms' }}>
              <div style={{ background: 'var(--carbon)', borderBottom: '1px solid var(--whisper)', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="flex items-center gap-2">
                  {['#6B2D2D', '#6B5C2D', '#2D4B35'].map((c) => (
                    <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  ))}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.06em', marginLeft: 8 }}>prompt.txt</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: copied ? 'var(--signal)' : 'var(--stone)', transition: 'color 150ms' }}
                >
                  {copied ? <CheckIcon style={{ width: 12, height: 12 }} /> : <DocumentDuplicateIcon style={{ width: 12, height: 12 }} />}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <div style={{ padding: '20px', background: 'var(--void)' }}>
                <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--stone)', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {prompt.prompt}
                </pre>
              </div>
              <div style={{ borderTop: '1px solid var(--whisper)', padding: '8px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.4, letterSpacing: '0.08em' }}>
                  {prompt.prompt.length} caracteres
                </span>
              </div>
            </div>

            {/* Reference images */}
            {prompt.images && prompt.images.length > 0 && (
              <div className="card animate-fade-up" style={{ padding: '20px', animationDelay: '80ms' }}>
                <span className="mono-label" style={{ marginBottom: 14 }}>Resultado esperado</span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {prompt.images.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                      style={{ flex: '1 1 200px', minWidth: 0, maxWidth: '100%', borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--whisper)', display: 'block', transition: 'border-color 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--signal)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--whisper)')}>
                      <img
                        src={src}
                        alt={`Referencia ${i + 1}`}
                        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                      />
                    </a>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: 'var(--stone)', opacity: 0.4, marginTop: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
                  Haz clic en una imagen para verla completa
                </p>
              </div>
            )}

            {/* Usage guide */}
            <div className="card animate-fade-up" style={{ padding: '20px', animationDelay: '100ms' }}>
              <span className="mono-label" style={{ marginBottom: 14 }}>Cómo usar</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { n: '01', title: 'Copia el texto', desc: 'Haz clic en el botón de copiar arriba para obtener el prompt completo.' },
                  { n: '02', title: 'Reemplaza las variables', desc: 'Busca el texto [entre corchetes] y completa con tus datos.' },
                  { n: `03`, title: `Abrir ${prompt.aiTool}`, desc: `Pega directamente en la entrada de ${prompt.aiTool}.` },
                  { n: '04', title: 'Refina si es necesario', desc: 'Ajusta el prompt según el resultado que obtengas.' },
                ].map((s) => (
                  <div key={s.n} className="flex gap-3">
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--signal)', opacity: 0.7, flexShrink: 0, paddingTop: 1 }}>{s.n}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--parchment)', marginBottom: 3 }}>{s.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--stone)', lineHeight: 1.6 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Author + stats */}
            <div className="card animate-fade-up" style={{ padding: '20px', animationDelay: '40ms' }}>
              {author && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--whisper)' }}>
                  <img
                    src={author.avatar || `https://ui-avatars.com/api/?name=${author.username}&background=F0F0F0&color=6B7280&size=64`}
                    alt={author.username}
                    className="avatar"
                    style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)' }}
                  />
                  <div>
                    <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Creado por</span>
                    <Link to={`/profile/${author.username}`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--parchment)', letterSpacing: '-0.01em' }}>
                      {author.username}
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Stat label="Vistas" value={prompt.views} />
                <Stat label="Guardados" value={prompt.favorites} />
                <Stat label="Valoraciones" value={prompt.ratings.count} />
                <Stat label="Prom." value={prompt.ratings.average.toFixed(1)} />
              </div>

              {/* Rating display */}
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--whisper)', marginBottom: 14 }}>
                <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Valoración de la comunidad</span>
                <Stars value={prompt.ratings.average} />
              </div>

              {/* User rating */}
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--whisper)' }}>
                <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {userRating > 0 ? 'Tu valoración' : 'Valora este prompt'}
                </span>
                {user ? (
                  <Stars value={userRating} interactive />
                ) : (
                  <Link to="/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    Inicia sesión para valorar
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleFavorite}
                className={`btn ${isFavorited ? '' : 'btn-ghost'}`}
                style={{
                  width: '100%', justifyContent: 'center', gap: 8,
                  background: isFavorited ? 'var(--destructive-dim)' : undefined,
                  borderColor: isFavorited ? 'rgba(224,112,112,0.3)' : undefined,
                  color: isFavorited ? 'var(--destructive)' : undefined,
                }}
              >
                {isFavorited ? <HeartSolid style={{ width: 14, height: 14 }} /> : <HeartIcon style={{ width: 14, height: 14 }} />}
                {isFavorited ? 'Guardado' : 'Guardar en favoritos'}
              </button>
              <button onClick={handleShare} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                <ShareIcon style={{ width: 14, height: 14 }} />
                Compartir
              </button>
              {/* Hide report button only from the prompt's own author */}
              {!(user && prompt.author && typeof prompt.author === 'object' && (prompt.author as any)._id?.toString() === user._id?.toString()) && (
                <button
                  onClick={() => {
                    if (!user) { toast.error('Inicia sesión para reportar'); return; }
                    setShowReportModal(true);
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', gap: 8, opacity: 0.5, fontSize: 11 }}
                >
                  <FlagIcon style={{ width: 12, height: 12 }} />
                  Reportar
                </button>
              )}
            </div>

            {/* Tags */}
            {prompt.tags.length > 0 && (
              <div className="card animate-fade-up" style={{ padding: '16px', animationDelay: '80ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <TagIcon style={{ width: 12, height: 12, color: 'var(--stone)', opacity: 0.5 }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Etiquetas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag, i) => (
                    <Link
                      key={i}
                      to={`/prompts?search=${tag}`}
                      className="chip"
                      style={{ transition: 'border-color 150ms, color 150ms' }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = 'rgba(232,184,75,0.3)';
                        el.style.color = 'var(--signal)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = '';
                        el.style.color = '';
                      }}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div className="card w-full max-w-md" style={{ background: 'var(--carbon)', padding: 28, borderRadius: 'var(--r-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FlagIcon style={{ width: 16, height: 16, color: 'var(--destructive)' }} />
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--parchment)' }}>
                  Reportar prompt
                </span>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)' }}
              >
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Motivo *
                </span>
                <div className="flex flex-col gap-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className="flex items-center gap-3 cursor-pointer"
                      style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', border: `1px solid ${reportReason === r.value ? 'rgba(224,112,112,0.4)' : 'var(--whisper)'}`, background: reportReason === r.value ? 'rgba(224,112,112,0.08)' : 'transparent', transition: 'all 120ms' }}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reportReason === r.value}
                        onChange={() => setReportReason(r.value)}
                        style={{ accentColor: 'var(--destructive)' }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--parchment)' }}>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Detalles adicionales (opcional)
                </span>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Describe el problema con más detalle..."
                  style={{ width: '100%', background: 'var(--void)', border: '1px solid var(--whisper)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--parchment)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: 10, color: 'var(--stone)', opacity: 0.4 }}>{reportDetails.length}/500</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason || reportSubmitting}
                  className="btn"
                  style={{ flex: 1, background: 'var(--destructive-dim)', borderColor: 'rgba(224,112,112,0.3)', color: 'var(--destructive)', opacity: !reportReason || reportSubmitting ? 0.5 : 1 }}
                >
                  {reportSubmitting ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptDetail;
