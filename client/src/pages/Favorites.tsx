import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { StarIcon, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { promptsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Prompt } from '../types';
import toast from 'react-hot-toast';

const Favorites: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        setLoading(true);
        try {
          const res = await promptsAPI.getFavorites();
          setFavorites(res.prompts || []);
        } catch { toast.error('Error al cargar favoritos'); }
        finally { setLoading(false); }
      })();
    }
  }, [isAuthenticated]);

  const handleRemove = async (id: string) => {
    try {
      await promptsAPI.toggleFavorite(id);
      setFavorites((prev) => prev.filter((p) => p._id !== id));
      toast.success('Eliminado de favoritos');
    } catch { toast.error('Error al eliminar'); }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '70vh', background: 'var(--void)' }}>
        <div className="card text-center" style={{ padding: '40px 32px', maxWidth: 360, width: '100%' }}>
          <div style={{ width: 44, height: 44, background: 'var(--destructive-dim)', border: '1px solid rgba(224,112,112,0.2)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <HeartIcon style={{ width: 20, height: 20, color: 'var(--destructive)' }} />
          </div>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 8 }}>Inicio de sesión requerido</h2>
          <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.6, marginBottom: 20 }}>Inicia sesión para ver tus prompts guardados.</p>
          <Link to="/login" className="btn btn-signal" style={{ width: '100%', justifyContent: 'center' }}>Iniciar sesión</Link>
        </div>
      </div>
    );
  }

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
            <span className="mono-label" style={{ marginBottom: 6 }}>Colección</span>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.025em' }}>
              Prompts Guardados
            </h1>
            <p style={{ fontSize: 13, color: 'var(--stone)', marginTop: 4 }}>Tu colección de prompts.</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', background: 'var(--ink)',
            border: '1px solid var(--whisper)', borderRadius: 'var(--r-md)',
          }}>
            <HeartSolid style={{ width: 16, height: 16, color: 'var(--destructive)' }} />
            <div>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Guardados</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em', lineHeight: 1 }}>{favorites.length}</p>
            </div>
          </div>
        </div>

        {/* Empty */}
        {favorites.length === 0 && (
          <div className="card flex flex-col items-center justify-center text-center" style={{ padding: '64px 24px' }}>
            <HeartIcon style={{ width: 28, height: 28, color: 'var(--stone)', opacity: 0.2, marginBottom: 14 }} />
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--parchment)', marginBottom: 6 }}>Nada guardado aún</h3>
            <p style={{ fontSize: 13, color: 'var(--stone)', maxWidth: 280, marginBottom: 20 }}>
              Explora prompts y haz clic en el ícono de corazón para guardarlos aquí.
            </p>
            <Link to="/prompts" className="btn btn-ghost">Explorar prompts</Link>
          </div>
        )}

        {/* Grid */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((prompt, i) => {
              const author = typeof prompt.author === 'object' ? prompt.author : null;
              const snippet = prompt.prompt?.slice(0, 130) || prompt.description?.slice(0, 130) || '';
              return (
                <div key={prompt._id} className="card animate-fade-up flex flex-col" style={{ padding: 0, animationDelay: `${i * 40}ms` }}>
                  <div style={{ padding: '18px 18px 14px', flex: 1 }}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="chip">{prompt.category.replace(/-/g, ' ')}</span>
                      <button
                        onClick={() => handleRemove(prompt._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--destructive)', transition: 'opacity 150ms' }}
                        title="Remove from favorites"
                      >
                        <HeartSolid style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                    <Link to={`/prompt/${prompt._id}`}>
                      <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--parchment)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 10 }} className="line-clamp-2">
                        {prompt.title}
                      </h3>
                    </Link>
                    {snippet && (
                      <div className="prompt-snippet">{snippet}{snippet.length >= 130 && <span style={{ opacity: 0.4 }}>…</span>}</div>
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
                        <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.4, fontFamily: 'JetBrains Mono, monospace' }}>{prompt.views}</span>
                      </div>
                    </div>
                    {author && (
                      <Link to={`/profile/${author.username}`} className="flex items-center gap-1.5">
                        <img src={author.avatar || `https://ui-avatars.com/api/?name=${author.username}&background=F0F0F0&color=6B7280&size=32`}
                          alt={author.username} className="avatar" style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: 10, color: 'var(--stone)', opacity: 0.6 }}>{author.username}</span>
                      </Link>
                    )}
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

export default Favorites;
