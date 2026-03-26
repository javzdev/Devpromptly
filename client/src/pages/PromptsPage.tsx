import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  HeartIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon as StarOutline,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { promptsAPI } from '../services/api';
import AdSenseAd from '../components/AdSenseAd';
import { useAuth } from '../contexts/AuthContext';
import { Prompt, PromptCategory, AITool } from '../types';
import toast from 'react-hot-toast';

const PAGE_BG = { background: 'var(--void)', minHeight: '100vh' };

/* ─── Select ───────────────────────────────────────────────────── */
const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}> = ({ value, onChange, label, options }) => (
  <div>
    <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--stone)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input"
      style={{ appearance: 'none', cursor: 'pointer', fontSize: 12 }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: '#1A1A1E', color: '#EDE8DF' }}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

/* ─── Prompt Card ──────────────────────────────────────────────── */
const PromptCard: React.FC<{
  prompt: Prompt;
  isFavorited: boolean;
  onFavorite: (id: string) => void;
  delay?: number;
}> = ({ prompt, isFavorited, onFavorite, delay = 0 }) => {
  const author = typeof prompt.author === 'object' ? prompt.author : null;
  const snippet = prompt.prompt?.slice(0, 140) || prompt.description?.slice(0, 140) || '';

  return (
    <div className="card animate-fade-up flex flex-col h-full" style={{ padding: 0, animationDelay: `${delay}ms` }}>
      <div style={{ padding: '18px 18px 14px', flex: 1 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="chip">{prompt.category.replace(/-/g, ' ')}</span>
            {prompt.isNSFW && (
              <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3, padding: '1px 5px', letterSpacing: '0.06em' }}>NSFW</span>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onFavorite(prompt._id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isFavorited ? 'var(--destructive)' : 'var(--stone)', opacity: isFavorited ? 1 : 0.5, transition: 'opacity 150ms, color 150ms' }}
          >
            {isFavorited ? <HeartSolid style={{ width: 14, height: 14 }} /> : <HeartIcon style={{ width: 14, height: 14 }} />}
          </button>
        </div>

        <Link to={`/prompt/${prompt._id}`}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--parchment)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 10, transition: 'color 150ms' }}
            className="line-clamp-2 group-hover:text-signal">
            {prompt.title}
          </h3>
        </Link>

        {snippet && (
          <div className="prompt-snippet">
            {snippet}{snippet.length >= 140 && <span style={{ opacity: 0.4 }}>…</span>}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--whisper)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <StarIcon style={{ width: 11, height: 11, color: 'var(--signal)' }} />
            <span style={{ fontSize: 11, color: 'var(--stone)', fontFamily: 'JetBrains Mono, monospace' }}>{prompt.ratings.average.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeIcon style={{ width: 11, height: 11, color: 'var(--stone)', opacity: 0.4 }} />
            <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>{prompt.views}</span>
          </div>
        </div>
        {author && (
          <div className="flex items-center gap-1.5">
            <img src={author.avatar || `https://ui-avatars.com/api/?name=${author.username}&background=F0F0F0&color=6B7280&size=32`}
              alt={author.username} className="avatar" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 10, color: 'var(--stone)', opacity: 0.6 }}>{author.username}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── PromptsPage ──────────────────────────────────────────────── */
const PromptsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: '', label: 'Todas las categorías' },
    { value: 'text-generation', label: 'Escritura y Chat' },
    { value: 'image-generation', label: 'Arte y Diseño' },
    { value: 'code-generation', label: 'Programación' },
    { value: 'audio-generation', label: 'Música y Audio' },
    { value: 'video-generation', label: 'Video y Movimiento' },
    { value: 'data-analysis', label: 'Ciencia de Datos' },
    { value: 'translation', label: 'Traducción' },
    { value: 'other', label: 'Otro' },
  ];

  const aiTools = [
    { value: '', label: 'Todas las herramientas' },
    { value: 'ChatGPT', label: 'ChatGPT' },
    { value: 'Claude', label: 'Claude' },
    { value: 'Midjourney', label: 'Midjourney' },
    { value: 'DALL-E', label: 'DALL-E' },
    { value: 'Stable Diffusion', label: 'Stable Diffusion' },
    { value: 'GitHub Copilot', label: 'Copilot' },
    { value: 'CodeLlama', label: 'CodeLlama' },
    { value: 'Other', label: 'Other' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'favorites', label: 'Más guardados' },
    { value: 'views', label: 'Más vistos' },
  ];

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') as PromptCategory || undefined,
    aiTool: searchParams.get('aiTool') as AITool || undefined,
    sort: (searchParams.get('sort') as any) || 'newest',
    featured: searchParams.get('featured') === 'true',
    page: parseInt(searchParams.get('page') || '1'),
  };

  useEffect(() => { load(); }, [searchParams]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await promptsAPI.getPrompts(filters);
      setPrompts(res.prompts || []);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load prompts'); }
    finally { setLoading(false); }
  };

  const update = (newFilters: Partial<typeof filters>) => {
    const merged = { ...filters, ...newFilters };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'newest' && v !== 1 && v !== false)
        params.set(k, String(v));
    });
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (new FormData(e.currentTarget).get('search') as string) || '';
    update({ search: q, page: 1 });
  };

  const handleFavorite = async (id: string) => {
    if (!user) { toast.error('Please log in to save'); return; }
    try {
      const res = await promptsAPI.toggleFavorite(id);
      setFavoriteStatus((prev) => ({ ...prev, [id]: res.favorited }));
      setPrompts((prev) => prev.map((p) => p._id === id ? { ...p, favorites: res.favoritesCount } : p));
    } catch { toast.error('Something went wrong'); }
  };

  const isFav = (id: string) => favoriteStatus[id] || user?.favorites.includes(id) || false;

  const hasFilters = filters.category || filters.aiTool || filters.featured;

  return (
    <div style={PAGE_BG}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid var(--whisper)', padding: '20px 0' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div style={{ flex: 1 }}>
              <span className="mono-label" style={{ marginBottom: 4 }}>Biblioteca</span>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.025em' }}>
                Explorar Prompts
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--stone)', opacity: 0.5 }} />
                <input
                  name="search"
                  type="text"
                  defaultValue={filters.search}
                  placeholder="Buscar…"
                  className="input"
                  style={{ paddingLeft: 32, width: 220, fontSize: 12 }}
                />
              </form>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-signal' : 'btn-ghost'}`}
                style={{ padding: '8px 14px', gap: 6, fontSize: 12 }}
              >
                <AdjustmentsHorizontalIcon style={{ width: 14, height: 14 }} />
                Filtros
                {hasFilters && <span style={{ width: 6, height: 6, borderRadius: '50%', background: showFilters ? 'var(--void)' : 'var(--signal)', display: 'inline-block' }} />}
              </button>
            </div>
          </div>

          {/* Inline filter panel */}
          {showFilters && (
            <div
              className="animate-fade-up grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5"
              style={{ paddingTop: 16, borderTop: '1px solid var(--whisper)' }}
            >
              <Select
                label="Categoría"
                value={filters.category || ''}
                onChange={(v) => update({ category: (v as PromptCategory) || undefined, page: 1 })}
                options={categories}
              />
              <Select
                label="Herramienta IA"
                value={filters.aiTool || ''}
                onChange={(v) => update({ aiTool: (v as AITool) || undefined, page: 1 })}
                options={aiTools}
              />
              <Select
                label="Ordenar"
                value={filters.sort}
                onChange={(v) => update({ sort: v as any, page: 1 })}
                options={sortOptions}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => update({ featured: !filters.featured, page: 1 })}
                  className={`btn ${filters.featured ? 'btn-signal' : 'btn-ghost'}`}
                  style={{ fontSize: 12, padding: '8px 14px', gap: 6 }}
                >
                  <StarOutline style={{ width: 13, height: 13 }} />
                  {filters.featured ? 'Solo destacados ✓' : 'Solo destacados'}
                </button>
                {hasFilters && (
                  <button
                    onClick={() => setSearchParams({})}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '6px 12px', color: 'var(--stone)', opacity: 0.7 }}
                  >
                    Limpiar todo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8" style={{ paddingTop: 32, paddingBottom: 72 }}>
        {/* Results meta */}
        <div className="flex items-center justify-between mb-6">
          <p style={{ fontSize: 12, color: 'var(--stone)', opacity: 0.7 }}>
            {loading ? 'Cargando…' : `${pagination.total} resultado${pagination.total !== 1 ? 's' : ''}`}
          </p>
          {!loading && pagination.pages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current === 1}
                onClick={() => update({ page: pagination.current - 1 })}
                className="btn btn-ghost"
                style={{ padding: '6px 10px', opacity: pagination.current === 1 ? 0.3 : 1 }}
              >
                <ChevronLeftIcon style={{ width: 14, height: 14 }} />
              </button>
              <span style={{ fontSize: 12, color: 'var(--stone)', fontFamily: 'JetBrains Mono, monospace' }}>
                {pagination.current} / {pagination.pages}
              </span>
              <button
                disabled={pagination.current === pagination.pages}
                onClick={() => update({ page: pagination.current + 1 })}
                className="btn btn-ghost"
                style={{ padding: '6px 10px', opacity: pagination.current === pagination.pages ? 0.3 : 1 }}
              >
                <ChevronRightIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80, gap: 16 }}>
            <div className="spinner" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.12em' }}>LOADING</span>
          </div>
        ) : prompts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {prompts.map((p, i) => (
                <PromptCard
                  key={p._id}
                  prompt={p}
                  isFavorited={isFav(p._id)}
                  onFavorite={handleFavorite}
                  delay={i * 40}
                />
              ))}
            </div>

            {/* Ad — after grid, before pagination */}
            <div style={{ marginTop: 40, marginBottom: 8 }}>
              <AdSenseAd adSlot="7259836401" adFormat="horizontal" />
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-1 mt-12">
                <button
                  disabled={pagination.current === 1}
                  onClick={() => update({ page: pagination.current - 1 })}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, opacity: pagination.current === 1 ? 0.3 : 1 }}
                >
                  Anterior
                </button>
                {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                  const page = i + 1;
                  const active = pagination.current === page;
                  return (
                    <button
                      key={page}
                      onClick={() => update({ page })}
                      className="btn"
                      style={{
                        width: 36, height: 36, padding: 0, fontSize: 12,
                        background: active ? 'var(--signal)' : 'transparent',
                        color: active ? 'var(--void)' : 'var(--stone)',
                        borderColor: active ? 'var(--signal)' : 'var(--whisper)',
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  disabled={pagination.current === pagination.pages}
                  onClick={() => update({ page: pagination.current + 1 })}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, opacity: pagination.current === pagination.pages ? 0.3 : 1 }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ paddingTop: 80, paddingBottom: 80 }}
          >
            <MagnifyingGlassIcon style={{ width: 32, height: 32, color: 'var(--stone)', opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 600, color: 'var(--parchment)', marginBottom: 8 }}>
              Sin prompts encontrados
            </h3>
            <p style={{ fontSize: 13, color: 'var(--stone)', maxWidth: 300, marginBottom: 24 }}>
              Intenta ajustar tu búsqueda o filtros.
            </p>
            <button onClick={() => setSearchParams({})} className="btn btn-ghost">
              Restablecer filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptsPage;
