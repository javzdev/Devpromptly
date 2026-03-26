import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Bienvenido de vuelta');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--void)' }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'fixed',
          top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: 480, height: 320,
          background: 'radial-gradient(ellipse, rgba(232,184,75,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="w-full max-w-sm animate-fade-up" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div
              style={{
                width: 40, height: 40,
                background: 'var(--signal)',
                borderRadius: 'var(--r-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: 'var(--void)' }}>G</span>
            </div>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Bienvenido de vuelta
              </h1>
              <p style={{ fontSize: 13, color: 'var(--stone)' }}>Inicia sesión en tu cuenta</p>
            </div>
          </Link>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--stone)', marginBottom: 6 }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <EnvelopeIcon
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--stone)', opacity: 0.5 }}
                />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--stone)' }}>Contraseña</label>
                <a href="#" style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.6, transition: 'opacity 150ms' }}>
                  ¿Olvidaste?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--stone)', opacity: 0.5 }}
                />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  {showPassword ? <EyeSlashIcon style={{ width: 14, height: 14 }} /> : <EyeIcon style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-signal"
              style={{ width: '100%', marginTop: 4, justifyContent: 'center', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  Iniciando sesión…
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--whisper)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--stone)' }}>
              ¿Sin cuenta?{' '}
              <Link to="/register" style={{ color: 'var(--signal)', fontWeight: 500 }}>
                Crea una
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
