import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PencilSquareIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  NewspaperIcon,
  PhotoIcon,
  StarIcon,
  ChatBubbleBottomCenterTextIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { blogAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage?: string;
  tags: string[];
  author: { _id: string; username: string; avatar?: string };
  featured: boolean;
  views: number;
  likes: string[];
  readTime: number;
  createdAt: string;
}

const CATEGORIES: Record<string, { label: string; color: string; bg: string; gradient: string; Icon: React.ComponentType<any> }> = {
  guide:    { label: 'Guía',     color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  gradient: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', Icon: BookOpenIcon },
  tutorial: { label: 'Tutorial', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', gradient: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', Icon: AcademicCapIcon },
  ranking:  { label: 'Ranking',  color: '#059669', bg: 'rgba(5,150,105,0.10)',   gradient: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', Icon: TrophyIcon },
  news:     { label: 'Noticias', color: '#DC2626', bg: 'rgba(220,38,38,0.10)',   gradient: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', Icon: NewspaperIcon },
  photo:    { label: 'Foto',     color: '#DB2777', bg: 'rgba(219,39,119,0.10)',  gradient: 'linear-gradient(135deg, #FDF2F8, #FCE7F3)', Icon: PhotoIcon },
  review:   { label: 'Reseña',   color: '#D97706', bg: 'rgba(217,119,6,0.10)',   gradient: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', Icon: StarIcon },
  opinion:  { label: 'Opinión',  color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  gradient: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', Icon: ChatBubbleBottomCenterTextIcon },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Single feed post ────────────────────────────────────── */
function FeedPost({ post, index }: { post: BlogPost; index: number }) {
  const cfg = CATEGORIES[post.category];
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className={`animate-fade-up stagger-${Math.min(index + 1, 6)}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--whisper)',
        background: hovered ? 'var(--ink)' : 'transparent',
        transition: 'background 150ms ease',
        cursor: 'pointer',
      }}
      onClick={() => window.location.href = `/blog/${post._id}`}
    >
      {/* Avatar column */}
      <div style={{ flexShrink: 0 }}>
        <Link to={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()}>
          <img
            src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=EEF2FA&color=3B82F6&bold=true&size=64`}
            alt={post.author.username}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid var(--smoke)',
              display: 'block',
            }}
          />
        </Link>
      </div>

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header row: name · handle · time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <Link
            to={`/profile/${post.author.username}`}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--parchment)', lineHeight: 1 }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {post.author.username}
          </Link>
          <span style={{ fontSize: 13, color: 'var(--dust)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--dust)' }}>{timeAgo(post.createdAt)}</span>
          {post.featured && (
            <>
              <span style={{ fontSize: 13, color: 'var(--dust)' }}>·</span>
              <span
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--signal)',
                  background: 'var(--signal-dim)', padding: '2px 7px', borderRadius: 3,
                }}
              >
                ★ Destacado
              </span>
            </>
          )}
          {/* Category pill — push to right */}
          <span style={{ marginLeft: 'auto' }}>
            <span
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: cfg?.color,
                background: cfg?.bg, padding: '2px 8px', borderRadius: 3,
              }}
            >
              {cfg?.label ?? post.category}
            </span>
          </span>
        </div>

        {/* Title */}
        <Link to={`/blog/${post._id}`} onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: hovered ? 'var(--signal)' : 'var(--parchment)',
              lineHeight: 1.4,
              margin: '0 0 5px',
              letterSpacing: '-0.01em',
              transition: 'color 150ms',
            }}
          >
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p
          style={{
            fontSize: 14,
            color: 'var(--stone)',
            lineHeight: 1.6,
            margin: '0 0 10px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.excerpt}
        </p>

        {/* Cover image — Twitter-style below text */}
        {post.coverImage ? (
          <div
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--whisper)',
              marginBottom: 10,
              height: 220,
            }}
          >
            <img
              src={post.coverImage}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ) : null}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {post.tags.slice(0, 4).map((tag) => (
              <span key={tag} style={{ fontSize: 12, color: 'var(--signal)', fontWeight: 500 }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 4 }}>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--dust)', cursor: 'default' }}
          >
            <ChatBubbleLeftIcon style={{ width: 16, height: 16 }} />
            <span>Comentario</span>
          </span>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--dust)' }}
          >
            <HeartIcon style={{ width: 16, height: 16 }} />
            <span>{post.likes.length > 0 ? post.likes.length : ''}</span>
          </span>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--dust)' }}
          >
            <EyeIcon style={{ width: 16, height: 16 }} />
            <span>{post.views > 0 ? post.views.toLocaleString() : ''}</span>
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--dust)' }}>
            {post.readTime} min de lectura
          </span>
        </div>
      </div>
    </article>
  );
}

function SkeletonPost() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px 16px 12px', borderBottom: '1px solid var(--whisper)' }}>
      <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 13, width: '35%' }} />
        <div className="skeleton" style={{ height: 18, width: '75%' }} />
        <div className="skeleton" style={{ height: 13, width: '100%' }} />
        <div className="skeleton" style={{ height: 13, width: '85%' }} />
        <div className="skeleton" style={{ height: 13, width: '50%' }} />
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────── */
export default function Blog() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && ['admin', 'moderator'].includes((user as any)?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    setLoading(true);
    blogAPI.getPosts({ category: activeCategory === 'all' ? undefined : activeCategory })
      .then(({ posts }) => setPosts(posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const setCategory = (cat: string) =>
    setSearchParams(cat === 'all' ? {} : { category: cat });

  const filtered = search.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.includes(search.toLowerCase()))
      )
    : posts;

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 80px' }}>

        {/* ─── Header ─────────────────────────────── */}
        <div
          className="animate-fade-up"
          style={{
            position: 'sticky',
            top: 56, // below the site header
            zIndex: 20,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--whisper)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--parchment)', margin: 0, flex: 1 }}>
            Blog
          </h1>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <MagnifyingGlassIcon
              style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--dust)' }}
            />
            <input
              className="input"
              type="text"
              placeholder="Buscar posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 30, fontSize: 13, width: 180, background: 'var(--carbon)' }}
            />
          </div>

          {isAdmin && (
            <Link to="/blog/new" className="btn btn-signal" style={{ gap: 5, padding: '7px 14px', fontSize: 12 }}>
              <PencilSquareIcon style={{ width: 13, height: 13 }} />
              Escribir
            </Link>
          )}
        </div>

        {/* ─── Category tabs ───────────────────────── */}
        <div
          className="animate-fade-up stagger-1"
          style={{
            display: 'flex',
            overflowX: 'auto',
            borderBottom: '1px solid var(--whisper)',
            scrollbarWidth: 'none',
          }}
        >
          {[{ key: 'all', label: 'Todos', color: 'var(--signal)' }, ...Object.entries(CATEGORIES).map(([key, c]) => ({ key, label: c.label, color: c.color }))].map(({ key, label, color }) => {
            const active = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                style={{
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: active ? 700 : 400,
                  color: active ? color : 'var(--stone)',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
                  marginBottom: -1,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 150ms',
                  flexShrink: 0,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ─── Feed ──────────────────────────────── */}
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => <SkeletonPost key={i} />)}
          </>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', color: 'var(--dust)' }}>
            <BookOpenIcon style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>
              {search ? `Sin posts encontrados para "${search}"` : 'Aún no hay posts.'}
            </p>
            {isAdmin && !search && (
              <Link to="/blog/new" className="btn btn-signal" style={{ marginTop: 20 }}>
                Escribe el primer post
              </Link>
            )}
          </div>
        ) : (
          filtered.map((post, i) => <FeedPost key={post._id} post={post} index={i} />)
        )}
      </div>
    </div>
  );
}
