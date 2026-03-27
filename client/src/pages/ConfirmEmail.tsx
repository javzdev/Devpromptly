import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

type Status = 'loading' | 'success' | 'error';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { confirmEmail } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('Enlace inválido. No se encontró el token de verificación.');
      return;
    }

    confirmEmail(token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error');
        setErrorMsg(err?.response?.data?.message || 'El enlace expiró o ya fue usado.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--void)' }}>
      <div className="w-full max-w-sm text-center animate-fade-up">
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 24px' }} />
            <p style={{ fontSize: 14, color: 'var(--stone)' }}>Verificando tu cuenta…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircleIcon style={{ width: 30, height: 30, color: '#4ADE80' }} />
            </div>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--parchment)', marginBottom: 10, letterSpacing: '-0.02em' }}>
              ¡Cuenta activada!
            </h1>
            <p style={{ fontSize: 14, color: 'var(--stone)', marginBottom: 32 }}>
              Tu email ha sido verificado. Ya puedes usar todas las funciones de DevPromptly.
            </p>
            <Link to="/" className="btn btn-signal" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Ir al inicio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <XCircleIcon style={{ width: 30, height: 30, color: '#F87171' }} />
            </div>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--parchment)', marginBottom: 10, letterSpacing: '-0.02em' }}>
              Enlace inválido
            </h1>
            <p style={{ fontSize: 14, color: 'var(--stone)', marginBottom: 32 }}>
              {errorMsg}
            </p>
            <Link to="/" style={{ fontSize: 13, color: 'var(--stone)', textDecoration: 'none' }}>
              Ir al inicio →
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
