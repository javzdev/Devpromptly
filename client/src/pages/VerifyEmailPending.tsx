import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const COOLDOWN = 60;

const VerifyEmailPending: React.FC = () => {
  const { user, resendVerificationEmail } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      await resendVerificationEmail();
      setCooldown(COOLDOWN);
      toast.success('Correo de verificación reenviado');
    } catch {
      toast.error('No se pudo reenviar el correo. Intenta más tarde.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--void)' }}>
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <EnvelopeIcon style={{ width: 28, height: 28, color: 'var(--signal)' }} />
        </div>

        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--parchment)', marginBottom: 10, letterSpacing: '-0.02em' }}>
          Revisa tu correo
        </h1>
        <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.6, marginBottom: 8 }}>
          Enviamos un enlace de activación a
        </p>
        {user?.email && (
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--parchment)', marginBottom: 24 }}>
            {user.email}
          </p>
        )}
        <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.6, marginBottom: 32 }}>
          Haz clic en el enlace del correo para activar tu cuenta. El enlace expira en 24 horas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleResend}
            disabled={isSending || cooldown > 0}
            className="btn"
            style={{ width: '100%', justifyContent: 'center', opacity: (isSending || cooldown > 0) ? 0.6 : 1 }}
          >
            {isSending ? (
              <><ArrowPathIcon style={{ width: 14, height: 14 }} />Enviando…</>
            ) : cooldown > 0 ? (
              <><CheckCircleIcon style={{ width: 14, height: 14, color: 'var(--signal)' }} />Enviado · reenviar en {cooldown}s</>
            ) : (
              <><ArrowPathIcon style={{ width: 14, height: 14 }} />Reenviar correo</>
            )}
          </button>
          <Link to="/" style={{ fontSize: 13, color: 'var(--stone)', textDecoration: 'none' }}>
            Ir al inicio →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPending;
