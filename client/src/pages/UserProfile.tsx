import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarIcon,
  HeartIcon,
  PencilIcon,
  SparklesIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Prompt } from '../types';
import toast from 'react-hot-toast';

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPrompts, setUserPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);

  useEffect(() => {
    if (username) {
      (async () => {
        setLoading(true);
        try {
          const res = await usersAPI.getUserProfile(username);
          setProfileUser(res.user);
          setUserPrompts(res.user.prompts || []);
        } catch { toast.error('Failed to load profile'); }
        finally { setLoading(false); }
      })();
    }
  }, [username]);

  useEffect(() => {
    if (currentUser && profileUser) setIsOwn(currentUser.username === profileUser.username);
  }, [currentUser, profileUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '70vh', background: 'var(--void)', gap: 16 }}>
        <div className="spinner" />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.12em' }}>LOADING</span>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-4" style={{ minHeight: '70vh', background: 'var(--void)' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--parchment)', marginBottom: 8 }}>Usuario no encontrado</h2>
        <p style={{ fontSize: 13, color: 'var(--stone)', marginBottom: 20 }}>No pudimos encontrar este perfil.</p>
        <Link to="/prompts" className="btn btn-ghost">Explorar prompts</Link>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Profile card */}
        <div className="card animate-fade-up" style={{ padding: '28px', marginBottom: 32 }}>
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.username}&background=F0F0F0&color=6B7280&bold=true&size=128`}
                alt={profileUser.username}
                className="avatar"
                style={{ width: 80, height: 80, borderRadius: 'var(--r-md)', border: '2px solid var(--smoke)' }}
              />
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--success)', border: '2px solid var(--void)',
              }} title="Active" />
            </div>

            {/* Info */}
            <div style={{ flex: 1, textAlign: 'center' }} className="md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.025em' }}>
                  {profileUser.username}
                </h1>
                {profileUser.role === 'admin' && (
                  <span className="chip chip-signal">Admin</span>
                )}
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--stone)' }}>
                  <CalendarIcon style={{ width: 13, height: 13, opacity: 0.5 }} />
                  Miembro desde {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" style={{ maxWidth: 480 }}>
                {[
                  { label: 'Prompts', value: profileUser.stats.promptsCreated },
                  { label: 'Rating Prom.', value: profileUser.stats.averageRating.toFixed(1) },
                  { label: 'Ratings', value: profileUser.stats.totalRatings },
                  { label: 'Guardados', value: profileUser.favorites.length },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'var(--carbon)', border: '1px solid var(--whisper)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)', opacity: 0.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {isOwn && (
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <Link to="/settings" className="btn btn-ghost" style={{ gap: 7, fontSize: 12 }}>
                    <PencilIcon style={{ width: 13, height: 13 }} />Editar Perfil
                  </Link>
                  <Link to="/create" className="btn btn-signal" style={{ gap: 7, fontSize: 12 }}>
                    <SparklesIcon style={{ width: 13, height: 13 }} />Nuevo Prompt
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--whisper)' }}>
            <div>
              <span className="mono-label" style={{ marginBottom: 4 }}>Prompts</span>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em' }}>
                Colección <span style={{ color: 'var(--stone)', fontSize: 14, fontWeight: 400 }}>({userPrompts.length})</span>
              </h2>
            </div>
            {userPrompts.length > 0 && (
              <Link to={`/prompts?author=${profileUser.username}`} className="flex items-center gap-1 nav-link" style={{ fontSize: 12 }}>
                Ver todos <ArrowUpRightIcon style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>

          {userPrompts.length === 0 ? (
            <div className="card flex flex-col items-center justify-center text-center" style={{ padding: '56px 24px' }}>
              <SparklesIcon style={{ width: 28, height: 28, color: 'var(--stone)', opacity: 0.2, marginBottom: 14 }} />
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--parchment)', marginBottom: 6 }}>Sin prompts aún</h3>
              <p style={{ fontSize: 13, color: 'var(--stone)', maxWidth: 260, marginBottom: isOwn ? 20 : 0 }}>
                {isOwn ? 'Crea tu primer prompt y compártelo.' : 'Este usuario no ha compartido prompts públicos aún.'}
              </p>
              {isOwn && <Link to="/create" className="btn btn-signal" style={{ fontSize: 12 }}>Crear primer prompt</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPrompts.map((prompt, i) => {
                const snippet = prompt.prompt?.slice(0, 130) || prompt.description?.slice(0, 130) || '';
                return (
                  <Link key={prompt._id} to={`/prompt/${prompt._id}`} className="block">
                    <div className="card animate-fade-up flex flex-col" style={{ padding: 0, animationDelay: `${i * 40}ms` }}>
                      <div style={{ padding: '18px 18px 14px', flex: 1 }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="chip">{prompt.category.replace(/-/g, ' ')}</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.06em' }}>{prompt.aiTool}</span>
                        </div>
                        <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--parchment)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 10 }} className="line-clamp-2">
                          {prompt.title}
                        </h3>
                        {snippet && (
                          <div className="prompt-snippet">{snippet}{snippet.length >= 130 && <span style={{ opacity: 0.4 }}>…</span>}</div>
                        )}
                      </div>
                      <div style={{ borderTop: '1px solid var(--whisper)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="flex items-center gap-1">
                          <StarIcon style={{ width: 11, height: 11, color: 'var(--signal)' }} />
                          <span style={{ fontSize: 11, color: 'var(--stone)', fontFamily: 'JetBrains Mono, monospace' }}>{prompt.ratings.average.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HeartIcon style={{ width: 11, height: 11, color: 'var(--stone)', opacity: 0.4 }} />
                          <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>{prompt.favorites}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
