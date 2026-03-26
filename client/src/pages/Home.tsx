import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  SparklesIcon,
  HeartIcon,
  ArrowUpRightIcon,
  CodeBracketIcon,
  CubeIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { promptsAPI } from '../services/api';
import { Prompt, PromptCategory } from '../types';
import AdSenseAd from '../components/AdSenseAd';

/* ─── Prompt Card ──────────────────────────────────────────────── */
const PromptCard: React.FC<{ prompt: Prompt; delay?: number }> = ({ prompt, delay = 0 }) => {
  const author = typeof prompt.author === 'object' ? prompt.author : null;
  const snippet = prompt.prompt?.slice(0, 160) || prompt.description?.slice(0, 160) || '';

  return (
    <div
      className="card animate-fade-up flex flex-col h-full"
      style={{ padding: 0, animationDelay: `${delay}ms` }}
    >
      <div style={{ padding: '20px 20px 16px', flex: 1 }}>
        {/* Meta row */}
        <div className="flex items-center justify-between mb-3">
          <span className="chip">
            {prompt.category.replace(/-/g, ' ')}
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: 'var(--stone)',
              letterSpacing: '0.06em',
              opacity: 0.6,
            }}
          >
            {prompt.aiTool}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--parchment)',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
            marginBottom: 12,
            transition: 'color 200ms ease',
          }}
          className="line-clamp-2"
        >
          {prompt.title}
        </h3>

        {/* Signature: monospace prompt snippet */}
        {snippet && (
          <div className="prompt-snippet">
            {snippet}
            {snippet.length >= 160 && (
              <span style={{ color: 'var(--stone)', opacity: 0.4 }}>…</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--whisper)',
          padding: '11px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {author ? (
          <div className="flex items-center gap-2">
            <img
              src={
                author.avatar ||
                `https://ui-avatars.com/api/?name=${author.username}&background=F0F0F0&color=6B7280&bold=true&size=48`
              }
              alt={author.username}
              className="avatar"
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.8 }}>
              {author.username}
            </span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <StarIcon className="h-3 w-3" style={{ color: 'var(--signal)' }} />
            <span
              style={{
                fontSize: 11,
                color: 'var(--stone)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {prompt.ratings.average.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <HeartIcon className="h-3 w-3" style={{ color: 'var(--stone)', opacity: 0.5 }} />
            <span
              style={{
                fontSize: 11,
                color: 'var(--stone)',
                opacity: 0.6,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {prompt.favorites}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Section Header ───────────────────────────────────────────── */
const SectionHeader: React.FC<{
  label: string;
  title: string;
  subtitle?: string;
  href: string;
  linkLabel?: string;
}> = ({ label, title, subtitle, href, linkLabel = 'Ver todos' }) => (
  <div className="flex items-end justify-between mb-8">
    <div>
      <span className="mono-label" style={{ marginBottom: 8 }}>{label}</span>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: 'var(--stone)', marginTop: 3 }}>{subtitle}</p>
      )}
    </div>
    <Link
      to={href}
      className="flex items-center gap-1 nav-link"
      style={{ fontSize: 12, flexShrink: 0 }}
    >
      {linkLabel}
      <ArrowUpRightIcon className="h-3 w-3" />
    </Link>
  </div>
);

/* ─── Prompt Grid ──────────────────────────────────────────────── */
const PromptGrid: React.FC<{ prompts: Prompt[] }> = ({ prompts }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {prompts.map((prompt, i) => (
      <Link key={prompt._id} to={`/prompt/${prompt._id}`} className="block">
        <PromptCard prompt={prompt} delay={i * 55} />
      </Link>
    ))}
  </div>
);

/* ─── Categories ───────────────────────────────────────────────── */
const categories: { value: PromptCategory; label: string; icon: React.ElementType }[] = [
  { value: 'text-generation',  label: 'Linguistic', icon: SparklesIcon     },
  { value: 'image-generation', label: 'Visual',     icon: CubeIcon         },
  { value: 'code-generation',  label: 'Logic',      icon: CodeBracketIcon  },
  { value: 'audio-generation', label: 'Acoustic',   icon: MusicalNoteIcon  },
  { value: 'video-generation', label: 'Kinetic',    icon: VideoCameraIcon  },
  { value: 'data-analysis',    label: 'Analytic',   icon: ChartBarIcon     },
];

/* ─── Terminal Preview Card ────────────────────────────────────── */
const TerminalPreview: React.FC<{ prompt?: Prompt }> = ({ prompt }) => (
  <div
    className="animate-fade-up"
    style={{ animationDelay: '120ms' }}
  >
    {/* Ambient glow behind the card */}
    <div
      style={{
        position: 'absolute',
        inset: -40,
        background: 'radial-gradient(ellipse 70% 60% at 60% 50%, rgba(232,184,75,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
    <div
      style={{
        background: 'var(--ink)',
        border: '1px solid var(--smoke)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(232,184,75,0.06), 0 8px 48px rgba(0,0,0,0.7)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Terminal bar */}
      <div
        style={{
          background: 'var(--carbon)',
          borderBottom: '1px solid var(--whisper)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {['#6B2D2D', '#6B5C2D', '#2D4B35'].map((c) => (
          <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
        ))}
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'var(--stone)',
            marginLeft: 10,
            letterSpacing: '0.06em',
            opacity: 0.6,
          }}
        >
          prompt.txt
        </span>
      </div>

      <div style={{ padding: '20px' }}>
        {prompt ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="chip chip-signal">{prompt.aiTool}</span>
              <span className="chip">{prompt.category.replace(/-/g, ' ')}</span>
            </div>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--parchment)',
                letterSpacing: '-0.02em',
                marginBottom: 14,
                lineHeight: 1.35,
              }}
            >
              {prompt.title}
            </p>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: 'var(--stone)',
                lineHeight: 1.75,
                padding: '12px 14px',
                background: 'var(--void)',
                border: '1px solid var(--whisper)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              <span style={{ color: 'var(--signal)', marginRight: 8, opacity: 0.9 }}>›</span>
              {(prompt.prompt || prompt.description || '').slice(0, 220)}
              {(prompt.prompt || prompt.description || '').length > 220 && (
                <span style={{ color: 'var(--stone)', opacity: 0.35 }}>…</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5">
                <StarIcon className="h-3 w-3" style={{ color: 'var(--signal)' }} />
                <span style={{ fontSize: 11, color: 'var(--stone)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {prompt.ratings.average.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartIcon className="h-3 w-3" style={{ color: 'var(--stone)', opacity: 0.5 }} />
                <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.6, fontFamily: 'JetBrains Mono, monospace' }}>
                  {prompt.favorites}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ─── Home ─────────────────────────────────────────────────────── */
const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [featuredPrompts, setFeaturedPrompts] = useState<Prompt[]>([]);
  const [recentPrompts, setRecentPrompts]     = useState<Prompt[]>([]);
  const [loading, setLoading]                 = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [featured, recent] = await Promise.all([
          promptsAPI.getPrompts({ featured: true, limit: 6 }),
          promptsAPI.getPrompts({ sort: 'newest', limit: 6 }),
        ]);
        setFeaturedPrompts(featured.prompts || []);
        setRecentPrompts(recent.prompts || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '70vh', background: 'var(--void)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: 'var(--stone)',
              letterSpacing: '0.14em',
              opacity: 0.5,
            }}
          >
            LOADING
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh' }}>

      {/* ─── Hero / Personalized Feed ──────────────────────────── */}
      {!isAuthenticated ? (
        <section style={{ padding: '80px 0 88px', position: 'relative', overflow: 'hidden' }}>
          {/* Far background glow — very subtle, warm */}
          <div
            style={{
              position: 'absolute',
              top: '-20%', left: '-10%',
              width: '50%', height: '140%',
              background: 'radial-gradient(ellipse, rgba(232,184,75,0.04) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />

          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left — editorial copy */}
              <div className="animate-fade-up">
                <div
                  className="flex items-center gap-2 mb-6"
                  style={{
                    display: 'inline-flex',
                    padding: '4px 10px 4px 6px',
                    border: '1px solid var(--whisper)',
                    borderRadius: 'var(--r-sm)',
                    marginBottom: 24,
                  }}
                >
                  <span
                    style={{
                      background: 'var(--signal-dim)',
                      border: '1px solid rgba(232,184,75,0.2)',
                      borderRadius: 'var(--r-xs)',
                      padding: '1px 6px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      fontWeight: 600,
                      color: 'var(--signal)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Bienvenido a DevPromptly
                  </span>
                </div>

                <h1
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 'clamp(38px, 5vw, 60px)',
                    fontWeight: 700,
                    color: 'var(--parchment)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.07,
                    marginBottom: 22,
                  }}
                >
                  Your creative
                  <br />
                  <span style={{ color: 'var(--signal)' }}>prompt library</span>
                  <span style={{ color: 'var(--stone)', opacity: 0.3 }}>.</span>
                </h1>

                <p
                  style={{
                    fontSize: 15,
                    color: 'var(--stone)',
                    lineHeight: 1.72,
                    maxWidth: 400,
                    marginBottom: 36,
                  }}
                >
                  Discover, share, and collaborate on AI prompts with a warm community of creators.
                  Join projects, explore communities, and grow together.
                </p>

                <div className="flex items-center gap-3">
                  <Link to="/prompts" className="btn btn-signal">
                    Explorar Prompts
                  </Link>
                  <Link to="/register" className="btn btn-ghost">
                    Comenzar a contribuir
                  </Link>
                </div>

                {/* Inline social proof */}
                <div
                  className="flex items-center gap-3 mt-8"
                  style={{ paddingTop: 24, borderTop: '1px solid var(--whisper)' }}
                >
                  <div className="flex -space-x-1.5">
                    {['A', 'B', 'C', 'D'].map((l) => (
                      <div
                        key={l}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'var(--graphite)',
                          border: '1.5px solid var(--ink)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 9,
                          fontWeight: 600,
                          color: 'var(--stone)',
                        }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — terminal preview */}
              <div className="hidden lg:block" style={{ position: 'relative' }}>
                <TerminalPreview prompt={featuredPrompts[0]} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section style={{ padding: '60px 0 40px' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="animate-fade-up">
              <h1
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 700,
                  color: 'var(--parchment)',
                  letterSpacing: '-0.03em',
                  marginBottom: 8,
                }}
              >
                Bienvenido de vuelta, {user?.username}
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--stone)',
                  lineHeight: 1.6,
                }}
              >
                Continúa explorando, crea nuevos prompts, o únete a debates en tus comunidades.
              </p>
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 28 }}>
              {[
                { to: '/create', label: '+ Compartir un Prompt', color: 'var(--signal)' },
                { to: '/forums', label: 'Explorar Comunidades', color: 'var(--stone)' },
                { to: '/tools', label: 'Herramientas', color: 'var(--stone)' },
                { to: '/blog', label: 'Blog', color: 'var(--stone)' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--carbon)',
                    border: '1px solid var(--whisper)',
                    borderRadius: 'var(--r-sm)',
                    color: link.color,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 200ms ease',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Categories Strip ──────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--whisper)', borderBottom: '1px solid var(--whisper)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div
            className="flex items-center gap-2 overflow-x-auto"
            style={{ padding: '12px 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat, i) => (
              <Link
                key={cat.value}
                to={`/prompts?category=${cat.value}`}
                className="category-pill animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <cat.icon className="h-3.5 w-3.5 flex-shrink-0" />
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <div
        className="max-w-7xl mx-auto px-5 sm:px-8"
        style={{ paddingTop: 72, paddingBottom: 96 }}
      >

        {/* Featured */}
        {featuredPrompts.length > 0 && (
          <section style={{ marginBottom: 72 }}>
            <SectionHeader
              label="Destacados"
              title="Prompts seleccionados"
              subtitle="Curados por calidad y utilidad."
              href="/prompts?featured=true"
            />
            <PromptGrid prompts={featuredPrompts} />
          </section>
        )}

        <hr className="rule" style={{ marginBottom: 72 }} />

        {/* Ad — between sections */}
        <div style={{ marginBottom: 72, borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          <AdSenseAd adSlot="7259836401" adFormat="horizontal" />
        </div>

        {/* Recent */}
        {recentPrompts.length > 0 && (
          <section style={{ marginBottom: 72 }}>
            <SectionHeader
              label="Recientes"
              title="Recién compartidos"
              subtitle="Últimas contribuciones de la comunidad."
              href="/prompts?sort=newest"
              linkLabel="Explorar todos"
            />
            <PromptGrid prompts={recentPrompts} />
          </section>
        )}

        {/* CTA — only for guests */}
        {!isAuthenticated && <div
          style={{
            borderTop: '1px solid var(--whisper)',
            paddingTop: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 0,
          }}
        >
          <span className="mono-label" style={{ marginBottom: 14 }}>Contribute</span>
          <h2
            style={{
              fontSize: 'clamp(22px, 3vw, 34px)',
              fontWeight: 700,
              color: 'var(--parchment)',
              letterSpacing: '-0.025em',
              maxWidth: 460,
              marginBottom: 14,
            }}
          >
            Comparte tus mejores prompts con la comunidad.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--stone)',
              maxWidth: 340,
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            Únete a miles de practicantes que contribuyen a la biblioteca de
            prompts más curada de la web.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/register" className="btn btn-signal">
              Empezar gratis
            </Link>
            <Link to="/prompts" className="btn btn-ghost">
              Explorar primero
            </Link>
          </div>
        </div>}
      </div>
    </div>
  );
};

export default Home;
