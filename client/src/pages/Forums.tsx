import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { forumsAPI } from '../services/api';
import ToolLogoImg from '../components/ToolLogoImg';
import { getDomain } from '../utils/urlHelpers';

// ─── Platform detection ───────────────────────────────────────────────────────
type Platform = 'Reddit' | 'Discord' | 'Facebook' | 'LinkedIn' | 'Plataforma';

function getPlatform(url: string): Platform {
  const u = (url || '').toLowerCase();
  if (u.includes('reddit.com'))                                           return 'Reddit';
  if (u.includes('discord.gg') || u.includes('discord.me') || u.includes('discord.com')) return 'Discord';
  if (u.includes('facebook.com'))                                         return 'Facebook';
  if (u.includes('linkedin.com'))                                         return 'LinkedIn';
  return 'Plataforma';
}

const PLATFORM_STYLES: Record<Platform, { dot: string; bg: string; emoji: string }> = {
  Reddit:     { dot: '#ff4500', bg: 'rgba(255,69,0,0.12)',    emoji: '🟠' },
  Discord:    { dot: '#5865f2', bg: 'rgba(88,101,242,0.12)',  emoji: '🔵' },
  Facebook:   { dot: '#1877f2', bg: 'rgba(24,119,242,0.12)',  emoji: '🔷' },
  LinkedIn:   { dot: '#0a66c2', bg: 'rgba(10,102,194,0.12)',  emoji: '💼' },
  Plataforma: { dot: '#94a3b8', bg: 'rgba(148,163,184,0.10)', emoji: '🌐' },
};

const PLATFORMS: Platform[] = ['Reddit', 'Discord', 'Facebook', 'LinkedIn', 'Plataforma'];

const LANG = {
  es: { flag: '🇪🇸', label: 'Español', dot: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  en: { flag: '🇬🇧', label: 'English', dot: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const ForumModal: React.FC<{ forum: any; onClose: () => void }> = ({ forum, onClose }) => {
  const platform = getPlatform(forum.url);
  const pStyle   = PLATFORM_STYLES[platform];
  const lang     = LANG[forum.language as 'es' | 'en'] ?? LANG.es;
  const domain   = getDomain(forum.url);

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
          background: 'var(--carbon)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r)', width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          animation: 'scaleIn 200ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Accent line */}
        <div style={{ height: 3, background: pStyle.dot, borderRadius: '12px 12px 0 0' }} />

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
            <div style={{
              background: 'var(--graphite)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--r-sm)', padding: 12, flexShrink: 0,
            }}>
              <ToolLogoImg url={forum.url} name={forum.name} size="w-14 h-14" />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <h2 style={{
                margin: '0 0 10px 0', fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em',
                color: 'var(--parchment)', lineHeight: 1.2,
              }}>
                {forum.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                {/* Platform */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 99,
                  background: pStyle.bg, color: pStyle.dot,
                  fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: pStyle.dot }} />
                  {platform}
                </span>
                {/* Language */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 99,
                  background: lang.bg, color: lang.dot,
                  fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {lang.flag} {lang.label}
                </span>
                {/* Domain */}
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.45 }}>
                  {domain}
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

          {/* Description */}
          <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
            {forum.description}
          </p>

          {/* CTA */}
          <a
            href={forum.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', borderRadius: 'var(--r-sm)',
              background: pStyle.dot, color: '#fff',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em',
              textDecoration: 'none', transition: '160ms',
              boxShadow: `0 4px 20px ${pStyle.bg}`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            Unirse a {forum.name}
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
const ForumCard: React.FC<{ forum: any; onClick: () => void }> = ({ forum, onClick }) => {
  const platform = getPlatform(forum.url);
  const pStyle   = PLATFORM_STYLES[platform];
  const lang     = LANG[forum.language as 'es' | 'en'] ?? LANG.es;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--carbon)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--r)', padding: '16px',
        transition: 'all 180ms cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--graphite)';
        el.style.borderColor = 'rgba(255,255,255,0.11)';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.25), 0 0 0 1px ${pStyle.dot}22`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--carbon)';
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        el.style.transform = 'none';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Top: logo + platform badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
        <div style={{
          background: 'var(--graphite)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--r-sm)', padding: 8, flexShrink: 0,
        }}>
          <ToolLogoImg url={forum.url} name={forum.name} size="w-9 h-9" />
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 99,
          background: pStyle.bg, color: pStyle.dot,
          fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.07em', textTransform: 'uppercase' as const, flexShrink: 0,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: pStyle.dot }} />
          {platform}
        </span>
      </div>

      {/* Name */}
      <p style={{
        margin: '0 0 6px 0', fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
        color: 'var(--parchment)', lineHeight: 1.3,
      }}>
        {forum.name}
      </p>

      {/* Description — 2 lines */}
      <p className="line-clamp-2" style={{
        margin: '0 0 14px 0', flex: 1,
        fontSize: 12, color: 'var(--stone)', lineHeight: 1.65,
      }}>
        {forum.description}
      </p>

      {/* Footer: language + Ver más */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: lang.dot,
        }}>
          {lang.flag} {lang.label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
          color: pStyle.dot, opacity: 0.8,
        }}>
          Ver más ↗
        </span>
      </div>
    </button>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Forums: React.FC = () => {
  const [allForums,  setAllForums]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [platform,   setPlatform]   = useState<'all' | Platform>('all');
  const [language,   setLanguage]   = useState<'all' | 'es' | 'en'>('all');
  const [selected,   setSelected]   = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await forumsAPI.getForums();
        setAllForums(data.forums ?? []);
      } catch {
        setAllForums([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let r = allForums;
    if (platform !== 'all') r = r.filter(f => getPlatform(f.url) === platform);
    if (language !== 'all') r = r.filter(f => (f.language ?? 'es') === language);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(f => f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q));
    }
    return r;
  }, [allForums, platform, language, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allForums.length };
    PLATFORMS.forEach(p => { c[p] = allForums.filter(f => getPlatform(f.url) === p).length; });
    return c;
  }, [allForums]);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh' }}>
      {/* Back */}
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
          <div style={{
            display: 'inline-flex', alignItems: 'center', padding: '6px 14px',
            borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', marginBottom: 24,
            fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--signal)',
          }}>
            Directorio de Comunidades
          </div>
          <h1 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--parchment)', marginBottom: 12,
          }}>
            Encuentra tu{' '}
            <span style={{ color: 'var(--signal)' }}>comunidad</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--stone)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
            {allForums.length > 0 && (
              <span style={{ color: 'var(--parchment)', fontWeight: 700 }}>{allForums.length}+ comunidades </span>
            )}
            de Reddit, Discord, foros y más — en español e inglés.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              style={{ color: 'var(--stone)', opacity: 0.5 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar comunidad..."
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-3">
        {/* Platform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setPlatform('all')}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--r-sm)',
              background: platform === 'all' ? 'var(--signal)' : 'rgba(255,255,255,0.05)',
              border: platform === 'all' ? '1px solid var(--signal)' : '1px solid rgba(255,255,255,0.08)',
              color: platform === 'all' ? '#fff' : 'var(--stone)',
              fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.06em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: '160ms',
            }}
          >
            Todas ({counts.all})
          </button>
          {PLATFORMS.map(p => {
            const s = PLATFORM_STYLES[p];
            const active = platform === p;
            return (
              <button key={p} onClick={() => setPlatform(p)}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--r-sm)',
                  background: active ? s.dot : 'rgba(255,255,255,0.05)',
                  border: active ? `1px solid ${s.dot}` : '1px solid rgba(255,255,255,0.08)',
                  color: active ? '#fff' : 'var(--stone)',
                  fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: '160ms',
                }}
              >
                {s.emoji} {p} ({counts[p] ?? 0})
              </button>
            );
          })}
        </div>

        {/* Language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {([
            { id: 'all', label: 'Todos los idiomas', dot: 'var(--stone)',  bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' },
            { id: 'es',  label: '🇪🇸 Español',       dot: '#ef4444',       bg: 'rgba(239,68,68,0.12)',   border: '#ef4444' },
            { id: 'en',  label: '🇬🇧 English',        dot: '#3b82f6',       bg: 'rgba(59,130,246,0.12)',  border: '#3b82f6' },
          ] as const).map(opt => {
            const active = language === opt.id;
            return (
              <button key={opt.id} onClick={() => setLanguage(opt.id)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--r-sm)',
                  background: active ? opt.bg : 'rgba(255,255,255,0.04)',
                  border: active ? `1px solid ${opt.border}` : '1px solid rgba(255,255,255,0.07)',
                  color: active ? opt.dot : 'var(--stone)',
                  fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer', transition: '160ms',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--signal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
            <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: 'var(--stone)', textTransform: 'uppercase' as const }}>
              Cargando comunidades...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', color: 'var(--stone)', textTransform: 'uppercase' as const }}>
              Sin resultados
            </p>
            <p style={{ fontSize: 12, color: 'var(--stone)', opacity: 0.5, marginTop: 4 }}>
              Prueba con otro filtro o búsqueda
            </p>
          </div>
        ) : (
          <>
            <p style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: 'var(--stone)', opacity: 0.45, marginBottom: 20,
            }}>
              {filtered.length} comunidad{filtered.length !== 1 ? 'es' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(forum => (
                <ForumCard key={forum._id} forum={forum} onClick={() => setSelected(forum)} />
              ))}
            </div>
          </>
        )}
      </div>

      {selected && <ForumModal forum={selected} onClose={handleClose} />}
    </div>
  );
};

export default Forums;
