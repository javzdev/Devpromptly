import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { aiToolsAPI } from '../services/api';
import AdSenseAd from '../components/AdSenseAd';
import ToolLogoImg from '../components/ToolLogoImg';
import { getDomain } from '../utils/urlHelpers';

const CATEGORIES = [
  { id: 'all',          label: 'Todas' },
  { id: 'chatbot',      label: 'Chatbots' },
  { id: 'writing',      label: 'Escritura' },
  { id: 'image',        label: 'Imágenes' },
  { id: 'code',         label: 'Código' },
  { id: 'audio',        label: 'Audio' },
  { id: 'video',        label: 'Video' },
  { id: 'productivity', label: 'Productividad' },
  { id: 'research',     label: 'Investigación' },
  { id: 'data',         label: 'Datos' },
  { id: 'other',        label: 'Otras' },
];

const CAT: Record<string, { dot: string; bg: string; label: string }> = {
  chatbot:      { dot: '#a78bfa', bg: 'rgba(167,139,250,0.13)', label: 'Chatbot' },
  writing:      { dot: '#60a5fa', bg: 'rgba(96,165,250,0.13)',  label: 'Escritura' },
  image:        { dot: '#f472b6', bg: 'rgba(244,114,182,0.13)', label: 'Imágenes' },
  code:         { dot: '#34d399', bg: 'rgba(52,211,153,0.13)',  label: 'Código' },
  audio:        { dot: '#fbbf24', bg: 'rgba(251,191,36,0.13)',  label: 'Audio' },
  video:        { dot: '#f87171', bg: 'rgba(248,113,113,0.13)', label: 'Video' },
  productivity: { dot: '#22d3ee', bg: 'rgba(34,211,238,0.13)',  label: 'Productividad' },
  research:     { dot: '#818cf8', bg: 'rgba(129,140,248,0.13)', label: 'Investigación' },
  data:         { dot: '#2dd4bf', bg: 'rgba(45,212,191,0.13)',  label: 'Datos' },
  other:        { dot: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label: 'Otras' },
};
const getCat = (id: string) => CAT[id] ?? CAT.other;

/** Split "What it does. Se hizo conocido/a por X." into two parts. */
function splitDesc(desc: string): { what: string; why: string | null } {
  const m = desc.match(/^([\s\S]+?)\. (Se hizo conocid[ao] .+)$/);
  if (!m) return { what: desc, why: null };
  return { what: m[1] + '.', why: m[2] };
}

// ─── Modal ────────────────────────────────────────────────────────────────────
const ToolModal: React.FC<{ tool: any; onClose: () => void }> = ({ tool, onClose }) => {
  const domain  = getDomain(tool.url);
  const cat     = getCat(tool.category);
  const catName = CATEGORIES.find(c => c.id === tool.category)?.label ?? tool.category;
  const { what, why } = splitDesc(tool.description ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px) saturate(0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, animation: 'fadeIn 140ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--carbon)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r)', width: '100%', maxWidth: 540,
          maxHeight: '92vh', overflowY: 'auto', position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          animation: 'scaleIn 200ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* ── Top accent line by category color ── */}
        <div style={{ height: 3, background: cat.dot, borderRadius: '12px 12px 0 0' }} />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 18, right: 18,
              background: 'var(--graphite)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--r-sm)', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--stone)', cursor: 'pointer', transition: '160ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--parchment)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--graphite)'; (e.currentTarget as HTMLElement).style.color = 'var(--stone)'; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
            {/* Logo */}
            <div style={{
              background: 'var(--graphite)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--r-sm)', padding: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ToolLogoImg url={tool.url} name={tool.name} size="w-14 h-14" />
            </div>

            {/* Title block */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <h2 style={{
                  margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em',
                  color: 'var(--parchment)', lineHeight: 1.15,
                }}>
                  {tool.name}
                </h2>
                {tool.featured && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                    padding: '3px 8px', borderRadius: 'var(--r-xs)',
                    color: 'var(--signal)', background: 'var(--signal-dim)',
                    border: '1px solid rgba(232,184,75,0.2)',
                  }}>★ Top</span>
                )}
              </div>

              {/* Category + domain */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 99,
                  background: cat.bg, color: cat.dot,
                  fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: cat.dot, flexShrink: 0 }} />
                  {catName}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: 'var(--stone)', opacity: 0.5,
                }}>
                  {domain}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              {what}
            </p>

            {why && (
              <div style={{
                marginTop: 14, padding: '14px 16px',
                background: 'var(--graphite)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${cat.dot}`,
                borderRadius: 'var(--r-sm)',
              }}>
                <p style={{
                  margin: '0 0 6px 0', fontSize: 10, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.07em', textTransform: 'uppercase' as const,
                  color: cat.dot,
                }}>
                  ¿Por qué es conocida?
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--stone)', lineHeight: 1.75 }}>
                  {why}
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', borderRadius: 'var(--r-sm)',
              background: 'var(--signal)', color: '#fff',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em',
              textDecoration: 'none', transition: '160ms',
              boxShadow: `0 4px 20px ${cat.bg}`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            Abrir {tool.name}
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
const ToolCard: React.FC<{ tool: any; onClick: () => void }> = ({ tool, onClick }) => {
  const cat     = getCat(tool.category);
  const catName = CATEGORIES.find(c => c.id === tool.category)?.label ?? tool.category;
  // Show only the "what" part (before "Se hizo conocido")
  const shortDesc = (tool.description ?? '').split('. Se hizo')[0];

  return (
    <button
      onClick={onClick}
      className="group"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--carbon)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--r)', padding: '16px',
        transition: 'all 180ms cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--graphite)';
        el.style.borderColor = `rgba(255,255,255,0.11)`;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.25), 0 0 0 1px ${cat.dot}22`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--carbon)';
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        el.style.transform = 'none';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Top row: logo + category badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
        <div style={{
          background: 'var(--graphite)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--r-sm)', padding: 8, flexShrink: 0,
        }}>
          <ToolLogoImg url={tool.url} name={tool.name} size="w-9 h-9" />
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 99,
          background: cat.bg, color: cat.dot,
          fontSize: 9, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.07em', textTransform: 'uppercase' as const,
          flexShrink: 0,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: cat.dot }} />
          {catName}
        </span>
      </div>

      {/* Name */}
      <p style={{
        margin: '0 0 6px 0',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
        color: 'var(--parchment)', lineHeight: 1.3,
      }}>
        {tool.name}
      </p>

      {/* Short description */}
      <p className="line-clamp-2" style={{
        margin: '0 0 14px 0', flex: 1,
        fontSize: 12, color: 'var(--stone)', lineHeight: 1.65,
      }}>
        {shortDesc}
      </p>

      {/* Footer: domain + "Ver detalles" */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%',
        paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: 'var(--stone)', opacity: 0.4,
        }}>
          {getDomain(tool.url)}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          color: cat.dot, opacity: 0.8,
        }}>
          Ver más ↗
        </span>
      </div>
    </button>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const AIToolsPage: React.FC = () => {
  const [allTools,      setAllTools]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search,        setSearch]        = useState('');
  const [selectedTool,  setSelectedTool]  = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await aiToolsAPI.getTools();
        setAllTools(data.tools ?? []);
      } catch {
        setAllTools([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let r = allTools;
    if (activeCategory !== 'all') r = r.filter(t => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return r;
  }, [allTools, activeCategory, search]);

  const handleClose = useCallback(() => setSelectedTool(null), []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--void)' }}>
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--stone)', textDecoration: 'none', transition: '150ms' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--parchment)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--stone)'}
        >
          <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Inicio
        </Link>
      </div>

      {/* Hero */}
      <div className="border-b border-white/5 pb-12 pt-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6"
            style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--signal)' }}
          >
            Directorio de Herramientas IA
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: 'var(--parchment)', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.03em' }}
          >
            Las mejores{' '}
            <span style={{ color: 'var(--signal)' }}>herramientas IA</span>
          </h1>
          <p className="text-base max-w-xl mx-auto mb-8" style={{ color: 'var(--stone)', lineHeight: 1.7 }}>
            {allTools.length > 0 && (
              <span style={{ color: 'var(--parchment)', fontWeight: 700 }}>{allTools.length}+ herramientas </span>
            )}
            seleccionadas para potenciar tu trabajo. Haz clic en cualquiera para ver la descripción completa y el enlace.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              style={{ color: 'var(--stone)', opacity: 0.5 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar herramienta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                background: 'var(--carbon)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--r-sm)', fontSize: 14, color: 'var(--parchment)',
                outline: 'none', transition: '160ms',
              }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--signal)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px var(--signal-dim)'; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            const style = getCat(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                style={{
                  flexShrink: 0, padding: '7px 16px',
                  borderRadius: 'var(--r-sm)',
                  background: active ? style.dot : 'rgba(255,255,255,0.05)',
                  border: active ? `1px solid ${style.dot}` : '1px solid rgba(255,255,255,0.08)',
                  color: active ? '#000' : 'var(--stone)',
                  fontSize: 11, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  cursor: 'pointer', transition: '160ms',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div style={{ marginBottom: 24 }}>
          <AdSenseAd adSlot="7259836401" adFormat="horizontal" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--signal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
            <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: 'var(--stone)', textTransform: 'uppercase' as const }}>
              Cargando herramientas...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{
              width: 56, height: 56, background: 'var(--carbon)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <svg style={{ width: 24, height: 24, color: 'var(--stone)', opacity: 0.4 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', color: 'var(--stone)', textTransform: 'uppercase' as const }}>
              Sin resultados
            </p>
            <p style={{ fontSize: 12, color: 'var(--stone)', opacity: 0.5, marginTop: 4 }}>
              Prueba con otra categoría o búsqueda
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--stone)', opacity: 0.45, marginBottom: 20 }}>
              {filtered.length} herramienta{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(tool => (
                <ToolCard key={tool._id} tool={tool} onClick={() => setSelectedTool(tool)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {selectedTool && <ToolModal tool={selectedTool} onClose={handleClose} />}
    </div>
  );
};

export default AIToolsPage;
