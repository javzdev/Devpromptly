import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  HeartIcon,
  EyeIcon,
  ClockIcon,
  TrashIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  NewspaperIcon,
  PhotoIcon,
  StarIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { blogAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  author: { _id: string; username: string; avatar?: string };
  content: string;
  createdAt: string;
}

interface Mention {
  kind: 'tool' | 'prompt' | 'community';
  refId: string;
  name: string;
  url?: string;
  category?: string;
  description?: string;
}

const MENTION_STYLES = {
  tool:      { label: 'Herramienta', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  prompt:    { label: 'Prompt',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)' },
  community: { label: 'Comunidad',   color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
};

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage?: string;
  images?: string[];
  mentions?: Mention[];
  tags: string[];
  author: { _id: string; username: string; avatar?: string; bio?: string };
  featured: boolean;
  views: number;
  likes: string[];
  readTime: number;
  createdAt: string;
  slug: string;
}

const CATEGORIES: Record<string, { label: string; color: string; bg: string; gradient: string; Icon: React.ComponentType<any> }> = {
  guide:    { label: 'Guía',     color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', Icon: BookOpenIcon },
  tutorial: { label: 'Tutorial', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', gradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', Icon: AcademicCapIcon },
  ranking:  { label: 'Ranking',  color: '#059669', bg: 'rgba(5,150,105,0.10)',   gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', Icon: TrophyIcon },
  news:     { label: 'Noticias', color: '#DC2626', bg: 'rgba(220,38,38,0.10)',   gradient: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', Icon: NewspaperIcon },
  photo:    { label: 'Foto',     color: '#DB2777', bg: 'rgba(219,39,119,0.10)',  gradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', Icon: PhotoIcon },
  review:   { label: 'Reseña',   color: '#D97706', bg: 'rgba(217,119,6,0.10)',   gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', Icon: StarIcon },
  opinion:  { label: 'Opinión',  color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  gradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', Icon: ChatBubbleBottomCenterTextIcon },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// ─── Lightbox ─────────────────────────────────────────────────────────────────
// ─── Twitter-style image grid ─────────────────────────────────────────────────
const ImageGallery: React.FC<{ images: string[] }> = ({ images }) => {
  const n = images.length;
  const GAP = 3;

  const cell = (src: string, idx: number, extra?: React.CSSProperties) => (
    <div key={idx} style={{ overflow: 'hidden', ...extra }}>
      <img
        src={src}
        alt={`Blog ${idx + 1}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={e => { if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.display = 'none'; }}
      />
    </div>
  );

  const wrapper: React.CSSProperties = {
    borderRadius: 12, overflow: 'hidden', border: '1px solid var(--whisper)',
  };

  let gridEl: React.ReactNode;

  if (n === 1) {
    gridEl = (
      <div style={wrapper}>
        <img src={images[0]} alt="Blog cover" style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }}
          onError={e => (e.currentTarget.style.display = 'none')} />
      </div>
    );
  } else if (n === 2) {
    gridEl = (
      <div style={{ ...wrapper, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP, height: 300 }}>
        {images.map((src, i) => cell(src, i))}
      </div>
    );
  } else if (n === 3) {
    gridEl = (
      <div style={{ ...wrapper, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: GAP, height: 320 }}>
        {cell(images[0], 0, { gridRow: '1 / 3' })}
        {cell(images[1], 1)}
        {cell(images[2], 2)}
      </div>
    );
  } else {
    // 4+ → 2×2 grid, all visible
    gridEl = (
      <div style={{ ...wrapper, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP }}>
        {images.map((src, i) => cell(src, i, { height: 200 }))}
      </div>
    );
  }

  return (
    <div className="animate-fade-up stagger-2" style={{ marginBottom: 48 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--stone)', marginBottom: 14 }}>
        Imágenes
      </p>
      {gridEl}
    </div>
  );
};

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    blogAPI.getComments(id).then((data) => setComments(data.comments)).catch(() => {});
    blogAPI.getPost(id).then((data) => {
      setPost(data);
      setLikesCount(data.likes?.length ?? 0);
      if (user && data.likes?.includes(user._id)) setLiked(true);
      setLoading(false);
    }).catch(() => {
      toast.error('Post no encontrado');
      navigate('/blog');
    });
  }, [id, user, navigate]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Inicia sesión para dar like'); return; }
    if (liking || !post) return;
    setLiking(true);
    try {
      const res = await blogAPI.likePost(post._id);
      setLiked(res.liked);
      setLikesCount(res.likes);
    } catch {
      toast.error('Algo salió mal');
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('¿Eliminar este post?')) return;
    try {
      await blogAPI.deletePost(post._id);
      toast.success('Post eliminado');
      navigate('/blog');
    } catch {
      toast.error('No se pudo eliminar el post');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await blogAPI.addComment(id!, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch {
      toast.error('No se pudo publicar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await blogAPI.deleteComment(id!, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      toast.error('Could not delete comment');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 40 }} />
        <div className="skeleton" style={{ height: 360, borderRadius: 12, marginBottom: 32 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 14, width: '30%' }} />
          <div className="skeleton" style={{ height: 36, width: '90%' }} />
          <div className="skeleton" style={{ height: 14, width: '50%' }} />
        </div>
      </div>
    );
  }

  if (!post) return null;

  const cfg = CATEGORIES[post.category];
  const { Icon } = cfg || { Icon: BookOpenIcon };
  const isAuthor = user && post.author._id === user._id;
  const isAdmin = user && ['admin', 'moderator'].includes((user as any)?.role);

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>

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
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--signal)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--stone)')}
          >
            <ArrowLeftIcon style={{ width: 14, height: 14 }} />
            Volver al Blog
          </Link>
        </div>

        {/* Cover image */}
        <div
          className="animate-fade-up"
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            height: 360,
            marginBottom: 36,
            border: '1px solid var(--whisper)',
          }}
        >
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: cfg?.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon style={{ width: 72, height: 72, color: cfg?.color, opacity: 0.3 }} />
            </div>
          )}
        </div>

        {/* Post header */}
        <div className="animate-fade-up stagger-1">
          {/* Category chip */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: cfg?.color,
              background: cfg?.bg,
              marginBottom: 14,
            }}
          >
            {cfg?.label ?? post.category}
          </span>

          {/* Title */}
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--parchment)',
              lineHeight: 1.3,
              marginBottom: 18,
              letterSpacing: '-0.02em',
            }}
          >
            {post.title}
          </h1>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 13,
              color: 'var(--stone)',
              paddingBottom: 20,
              borderBottom: '1px solid var(--whisper)',
              marginBottom: 32,
            }}
          >
            <Link
              to={`/profile/${post.author.username}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <img
                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=EEF2FA&color=3B82F6&bold=true&size=40`}
                alt={post.author.username}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--smoke)' }}
              />
              <span style={{ fontWeight: 600, color: 'var(--parchment)' }}>{post.author.username}</span>
            </Link>
            <span style={{ color: 'var(--whisper-text)' }}>·</span>
            <span>{formatDate(post.createdAt)}</span>
            <span style={{ color: 'var(--whisper-text)' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ClockIcon style={{ width: 13, height: 13 }} />
              {post.readTime} min de lectura
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <EyeIcon style={{ width: 13, height: 13 }} />
              {post.views} vistas
            </span>

            {/* Author/admin actions */}
            {(isAuthor || isAdmin) && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDelete}
                  className="btn btn-ghost"
                  style={{ padding: '5px 12px', fontSize: 12, color: 'var(--destructive)', gap: 5 }}
                >
                  <TrashIcon style={{ width: 13, height: 13 }} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className="animate-fade-up stagger-2"
          style={{
            fontSize: 16,
            lineHeight: 1.85,
            color: 'var(--parchment)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 48,
          }}
        >
          {post.content}
        </div>

        {/* Mentions */}
        {post.mentions && post.mentions.length > 0 && (
          <div className="animate-fade-up stagger-2" style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--stone)', marginBottom: 16 }}>
              Recursos mencionados
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {post.mentions.map((m, i) => {
                const s = MENTION_STYLES[m.kind];
                const isInternal = m.kind === 'prompt';
                const Tag = isInternal ? Link : 'a';
                const linkProps = isInternal
                  ? { to: m.url ?? `/prompt/${m.refId}` }
                  : { href: m.url ?? '#', target: '_blank', rel: 'noopener noreferrer' };
                return (
                  <Tag key={i} {...(linkProps as any)} style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '14px 16px', borderRadius: 10,
                    border: `1px solid ${s.border}`,
                    background: s.bg,
                    textDecoration: 'none', transition: 'all 160ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${s.bg}`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                        color: s.color, padding: '3px 8px', borderRadius: 4, background: `${s.color}18`,
                      }}>
                        {s.label}
                      </span>
                      <svg width="11" height="11" fill="none" stroke={s.color} strokeWidth={2.2} viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.7 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--parchment)', lineHeight: 1.3 }}>
                      {m.name}
                    </p>
                    {m.category && (
                      <span style={{ fontSize: 11, color: 'var(--stone)' }}>{m.category}</span>
                    )}
                    {m.description && (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--stone)', lineHeight: 1.55,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                      }}>
                        {m.description}
                      </p>
                    )}
                  </Tag>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional images gallery */}
        {post.images && post.images.length > 0 && (
          <ImageGallery images={post.images} />
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div
            className="animate-fade-up stagger-3"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 36 }}
          >
            {post.tags.map((tag) => (
              <span key={tag} className="chip">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Like button */}
        <div
          className="animate-fade-up stagger-3"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingTop: 24,
            borderTop: '1px solid var(--whisper)',
            marginBottom: 40,
          }}
        >
          <button
            onClick={handleLike}
            disabled={liking}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              borderRadius: 6,
              border: liked ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--whisper)',
              background: liked ? 'rgba(220,38,38,0.06)' : 'transparent',
              color: liked ? '#DC2626' : 'var(--stone)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 160ms ease',
            }}
          >
            {liked ? (
              <HeartSolid style={{ width: 15, height: 15, color: '#DC2626' }} />
            ) : (
              <HeartIcon style={{ width: 15, height: 15 }} />
            )}
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </button>
          <span style={{ fontSize: 13, color: 'var(--dust)' }}>
            {liked ? 'Te gustó este post' : '¿Te fue útil este post?'}
          </span>
        </div>

        {/* Comments section */}
        <div className="animate-fade-up stagger-4" style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <ChatBubbleLeftIcon style={{ width: 18, height: 18, color: 'var(--stone)' }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--parchment)', margin: 0 }}>
              Comentarios
              {comments.length > 0 && (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--stone)', marginLeft: 8 }}>
                  ({comments.length})
                </span>
              )}
            </h3>
          </div>

          {/* Comment form */}
          {isAuthenticated ? (
            <form onSubmit={handleComment} style={{ marginBottom: 28 }}>
              <div
                style={{
                  border: '1px solid var(--whisper)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  transition: 'border-color 160ms, box-shadow 160ms',
                }}
                onFocus={() => {}}
              >
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Deja un comentario..."
                  rows={3}
                  maxLength={1000}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    padding: '14px 16px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--parchment)',
                    background: 'var(--ink)',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--carbon)',
                    borderTop: '1px solid var(--whisper)',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--dust)' }}>
                    {commentText.length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="btn btn-signal"
                    style={{ padding: '6px 16px', fontSize: 12, gap: 5, opacity: !commentText.trim() ? 0.5 : 1 }}
                  >
                    {submittingComment ? (
                      <div className="spinner" style={{ width: 12, height: 12 }} />
                    ) : (
                      <PaperAirplaneIcon style={{ width: 13, height: 13 }} />
                    )}
                    Publicar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 10,
                border: '1px solid var(--whisper)',
                background: 'var(--ink)',
                fontSize: 14,
                color: 'var(--stone)',
                marginBottom: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Inicia sesión para comentar</span>
              <Link to="/login" className="btn btn-signal" style={{ padding: '6px 16px', fontSize: 12 }}>
                Iniciar sesión
              </Link>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--dust)', textAlign: 'center', padding: '24px 0' }}>
              Sin comentarios aún. ¡Sé el primero!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.map((comment) => {
                const isOwn = user && comment.author._id === user._id;
                const canDelete = isOwn || isAdmin;
                return (
                  <div
                    key={comment._id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '16px',
                      borderRadius: 10,
                      border: '1px solid var(--whisper)',
                      background: 'var(--ink)',
                    }}
                  >
                    <img
                      src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.username}&background=EEF2FA&color=3B82F6&bold=true&size=40`}
                      alt={comment.author.username}
                      style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--smoke)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Link
                          to={`/profile/${comment.author.username}`}
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--parchment)' }}
                        >
                          {comment.author.username}
                        </Link>
                        <span style={{ fontSize: 11, color: 'var(--dust)' }}>
                          {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            style={{
                              marginLeft: 'auto',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              color: 'var(--dust)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              transition: 'color 150ms',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--destructive)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dust)')}
                          >
                            <TrashIcon style={{ width: 11, height: 11 }} />
                            Eliminar
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Author card */}
        <div
          className="card animate-fade-up stagger-4"
          style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 18 }}
        >
          <img
            src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=EEF2FA&color=3B82F6&bold=true&size=64`}
            alt={post.author.username}
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--smoke)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 2 }}>Escrito por</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--parchment)', margin: 0 }}>{post.author.username}</p>
            {post.author.bio && (
              <p style={{ fontSize: 13, color: 'var(--stone)', marginTop: 4, lineHeight: 1.5 }}>{post.author.bio}</p>
            )}
          </div>
          <Link
            to={`/profile/${post.author.username}`}
            className="btn btn-ghost"
            style={{ padding: '7px 16px', fontSize: 12, flexShrink: 0 }}
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
