import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { notificationsAPI } from '../services/api';

const POLL_INTERVAL = 30_000; // 30 seconds

const TYPE_ICON: Record<string, string> = {
  prompt_approved: '🎉',
  prompt_rejected: '❌',
  new_report: '🚨',
  new_pending_prompt: '📝',
  report_resolved: '✅',
};

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const { count } = await notificationsAPI.getUnreadCount();
      setUnreadCount(count);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsAPI.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Load full list when dropdown opens
  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n: any) => {
    if (!n.read) {
      await notificationsAPI.markRead(n._id).catch(() => {});
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationsAPI.delete(id).catch(() => {});
    setNotifications(prev => {
      const removed = prev.find(x => x._id === id);
      if (removed && !removed.read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(x => x._id !== id);
    });
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
          borderRadius: 8,
          color: unreadCount > 0 ? 'var(--signal)' : 'var(--stone)',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 150ms',
        }}
        aria-label="Notificaciones"
      >
        {unreadCount > 0
          ? <BellAlertIcon style={{ width: 20, height: 20 }} />
          : <BellIcon style={{ width: 20, height: 20 }} />
        }
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: 'var(--destructive)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="animate-scale-in"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 340,
            background: 'var(--carbon)',
            border: '1px solid var(--whisper)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            zIndex: 100,
            overflow: 'hidden',
            transformOrigin: 'top right',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid var(--whisper)' }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--parchment)' }}>
              Notificaciones
              {unreadCount > 0 && (
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: 'var(--destructive)', color: '#fff', borderRadius: 6, padding: '1px 6px' }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--stone)', padding: 4, borderRadius: 6 }}
              >
                <CheckIcon style={{ width: 12, height: 12 }} />
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <BellIcon style={{ width: 28, height: 28, color: 'var(--graphite)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--stone)' }}>Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '11px 14px',
                    borderBottom: '1px solid var(--whisper)',
                    cursor: n.link ? 'pointer' : 'default',
                    background: n.read ? 'transparent' : 'rgba(232,184,75,0.04)',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(232,184,75,0.04)')}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, paddingTop: 1 }}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: 'var(--parchment)', marginBottom: 2, lineHeight: 1.4 }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--stone)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: 10, color: 'var(--graphite)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4, display: 'block' }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {!n.read && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal)', marginTop: 3 }} />
                    )}
                    <button
                      onClick={e => handleDelete(e, n._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--graphite)', padding: 2, borderRadius: 4, opacity: 0.6 }}
                    >
                      <TrashIcon style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
