import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { promptsAPI } from '../services/api';
import { Prompt } from '../types';
import toast from 'react-hot-toast';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
  approved: { color: 'var(--success)', bg: 'var(--success-dim)', border: 'rgba(94,204,139,0.25)' },
  pending:  { color: 'var(--signal)', bg: 'var(--signal-dim)',   border: 'rgba(232,184,75,0.25)' },
  rejected: { color: 'var(--destructive)', bg: 'var(--destructive-dim)', border: 'rgba(224,112,112,0.25)' },
};

const statusLabel: Record<string, string> = {
  approved: 'Approved',
  pending: 'In review',
  rejected: 'Action required',
};

const MyPrompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const res = await promptsAPI.getMyPrompts();
      setPrompts(res.prompts || []);
    } catch { toast.error('Failed to load prompts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPrompts(); }, []);

  const handleDelete = async (promptId: string, title: string) => {
    if (!window.confirm(`¿Eliminar "${title}" permanentemente? Esta acción no se puede deshacer.`)) return;
    setDeletingId(promptId);
    try {
      await promptsAPI.deletePrompt(promptId);
      toast.success('Prompt eliminado');
      setPrompts(prev => prev.filter(p => p._id !== promptId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar prompt');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = filter === 'all' ? prompts : prompts.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '70vh', background: 'var(--void)', gap: 16 }}>
        <div className="spinner" />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.12em' }}>LOADING</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--whisper)', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="mono-label" style={{ marginBottom: 6 }}>Mi Biblioteca</span>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.025em' }}>
              Tus Prompts
            </h1>
            <p style={{ fontSize: 13, color: 'var(--stone)', marginTop: 4 }}>Gestiona y rastrea tus plantillas compartidas.</p>
          </div>
          <Link to="/prompts" className="btn btn-signal" style={{ gap: 7 }}>
            Prompts
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {([
            { id: 'all',      label: 'Todos',             count: prompts.length },
            { id: 'pending',  label: 'En Revisión',       count: prompts.filter((p) => p.status === 'pending').length },
            { id: 'approved', label: 'Aprobado',          count: prompts.filter((p) => p.status === 'approved').length },
            { id: 'rejected', label: 'Necesita Corrección', count: prompts.filter((p) => p.status === 'rejected').length },
          ] as { id: Filter; label: string; count: number }[]).map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="btn"
                style={{
                  fontSize: 12, padding: '7px 14px',
                  background: active ? 'var(--signal)' : 'transparent',
                  color: active ? 'var(--void)' : 'var(--stone)',
                  borderColor: active ? 'var(--signal)' : 'var(--whisper)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {f.label}
                <span style={{ marginLeft: 5, opacity: 0.6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                  ({f.count})
                </span>
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--stone)', opacity: 0.5 }}>
            {filtered.length} entradas
          </span>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="card flex flex-col items-center justify-center text-center" style={{ padding: '64px 24px' }}>
            <svg style={{ width: 28, height: 28, color: 'var(--stone)', opacity: 0.2, marginBottom: 14 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--parchment)', marginBottom: 6 }}>
              {prompts.length === 0 ? 'Comienza tu biblioteca' : `Sin prompts con estado "${filter}"`}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--stone)', maxWidth: 280, marginBottom: 20 }}>
              {prompts.length === 0 ? 'Crea tu primer prompt y compártelo con la comunidad.' : `Sin prompts con el estado "${filter}".`}
            </p>
            {prompts.length === 0 && (
              <Link to="/create" className="btn btn-signal">Create first prompt</Link>
            )}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((prompt, i) => {
              const st = statusStyle[prompt.status] || statusStyle.pending;
              return (
                <div key={prompt._id} className="card animate-fade-up flex flex-col" style={{ padding: 0, animationDelay: `${i * 40}ms` }}>
                  <div style={{ padding: '18px 18px 14px', flex: 1 }}>
                    <div className="flex items-start justify-between mb-3">
                      <Link to={`/prompt/${prompt._id}`}>
                        <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--parchment)', letterSpacing: '-0.02em', lineHeight: 1.3, transition: 'color 150ms' }}
                          className="line-clamp-2">
                          {prompt.title}
                        </h3>
                      </Link>
                      <span style={{
                        flexShrink: 0, marginLeft: 8,
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: 'var(--r-xs)',
                        color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                      }}>
                        {statusLabel[prompt.status] || prompt.status}
                      </span>
                    </div>

                    <p className="line-clamp-2" style={{ fontSize: 12, color: 'var(--stone)', lineHeight: 1.6, marginBottom: 12 }}>
                      {prompt.description}
                    </p>

                    {prompt.status === 'rejected' && prompt.rejectionReason && (
                      <div style={{ padding: '8px 12px', background: 'var(--destructive-dim)', border: '1px solid rgba(224,112,112,0.2)', borderRadius: 'var(--r-sm)', marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: 'var(--destructive)', lineHeight: 1.5 }}>{prompt.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <span className="chip">{prompt.category.replace(/-/g, ' ')}</span>
                      <span className="chip">{prompt.aiTool}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--whisper)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <StarIcon style={{ width: 11, height: 11, color: 'var(--signal)' }} />
                        <span style={{ fontSize: 11, color: 'var(--stone)', fontFamily: 'JetBrains Mono, monospace' }}>{prompt.ratings.average.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HeartIcon style={{ width: 11, height: 11, color: 'var(--stone)', opacity: 0.4 }} />
                        <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>{prompt.favorites}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <EyeIcon style={{ width: 11, height: 11, color: 'var(--stone)', opacity: 0.4 }} />
                        <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.4, fontFamily: 'JetBrains Mono, monospace' }}>{prompt.views}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/edit/${prompt._id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--stone)', opacity: 0.6, transition: 'opacity 150ms' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
                      >
                        <PencilIcon style={{ width: 12, height: 12 }} />Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(prompt._id, prompt.title)}
                        disabled={deletingId === prompt._id}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--stone)', opacity: deletingId === prompt._id ? 0.6 : 0.4, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 150ms, color 150ms' }}
                        onMouseEnter={(e) => { if (deletingId !== prompt._id) { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.color = 'var(--destructive)'; } }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.4'; el.style.color = 'var(--stone)'; }}
                      >
                        <TrashIcon style={{ width: 12, height: 12 }} />{deletingId === prompt._id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPrompts;
