import React, { useState } from 'react';
import { EnvelopeIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EmailVerificationBanner: React.FC = () => {
  const { user, isAuthenticated, resendVerificationEmail } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isAuthenticated || !user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendVerificationEmail();
      toast.success('Correo de verificación enviado');
    } catch {
      toast.error('No se pudo reenviar. Intenta más tarde.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(232,184,75,0.08)',
      borderBottom: '1px solid rgba(232,184,75,0.2)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <EnvelopeIcon style={{ width: 15, height: 15, color: 'var(--signal)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--stone)' }}>
        Verifica tu correo electrónico para acceder a todas las funciones.
      </span>
      <button
        onClick={handleResend}
        disabled={isSending}
        style={{
          fontSize: 12, fontWeight: 600, color: 'var(--signal)',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          opacity: isSending ? 0.6 : 1, padding: 0,
        }}
      >
        {isSending && <ArrowPathIcon style={{ width: 12, height: 12 }} />}
        {isSending ? 'Enviando…' : 'Reenviar correo'}
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: 4, color: 'var(--stone)', opacity: 0.5, display: 'flex' }}
        aria-label="Cerrar"
      >
        <XMarkIcon style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
};

export default EmailVerificationBanner;
