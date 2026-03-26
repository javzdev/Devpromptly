import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'password' | 'preferences' | 'danger';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--stone)', marginBottom: 6 }}>{children}</label>
);

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    username: user?.username || '',
    avatar: user?.avatar || '',
  });

  const [showNSFW, setShowNSFW] = useState<boolean>(user?.preferences?.showNSFW ?? false);

  const handleNSFWToggle = async (val: boolean) => {
    setShowNSFW(val);
    try {
      await usersAPI.updatePreferences({ showNSFW: val });
      toast.success(val ? 'Contenido NSFW activado' : 'Contenido NSFW ocultado');
    } catch {
      setShowNSFW(!val);
      toast.error('Error al guardar preferencias');
    }
  };

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersAPI.updateProfile({ username: profile.username, avatar: profile.avatar });
      toast.success('Perfil actualizado');
    } catch { toast.error('Error al actualizar perfil'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await usersAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Contraseña actualizada');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { toast.error('Error al actualizar contraseña'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    const pw = window.prompt('Enter your password to confirm deletion:');
    if (!pw) return;
    setLoading(true);
    try {
      await usersAPI.deleteAccount(pw);
      toast.success('Cuenta eliminada');
      logout();
      navigate('/');
    } catch { toast.error('Error al eliminar cuenta'); }
    finally { setLoading(false); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',     label: 'Perfil',        icon: UserCircleIcon },
    { id: 'password',    label: 'Seguridad',    icon: KeyIcon },
    { id: 'preferences', label: 'Preferencias', icon: AdjustmentsHorizontalIcon },
    { id: 'danger',      label: 'Peligro',      icon: ExclamationTriangleIcon },
  ];

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <Link to={`/profile/${user?.username}`} className="flex items-center gap-1.5 nav-link" style={{ display: 'inline-flex', marginBottom: 16, fontSize: 12 }}>
            <ChevronLeftIcon style={{ width: 13, height: 13 }} />
            Volver al perfil
          </Link>
          <span className="mono-label" style={{ marginBottom: 6 }}>Cuenta</span>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.025em' }}>
            Configuración
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--r-sm)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: active ? '1px solid var(--smoke)' : '1px solid transparent',
                    background: active ? 'var(--carbon)' : 'transparent',
                    color: t.id === 'danger' && active ? 'var(--destructive)' : active ? 'var(--parchment)' : 'var(--stone)',
                    transition: 'all 150ms ease',
                    textAlign: 'left', width: '100%',
                  }}
                >
                  <t.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card" style={{ padding: '28px', minHeight: 400 }}>
              {tab === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em', marginBottom: 4 }}>Perfil Público</h2>
                    <p style={{ fontSize: 12, color: 'var(--stone)' }}>Actualiza cómo aparecer ante la comunidad.</p>
                  </div>

                  <div>
                    <Label>Usuario</Label>
                    <input
                      type="text" value={profile.username}
                      onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                      className="input" style={{ fontSize: 13 }}
                      placeholder="Tu nombre de usuario"
                    />
                  </div>

                  <div>
                    <Label>URL del Avatar</Label>
                    <input
                      type="url" value={profile.avatar}
                      onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))}
                      className="input" style={{ fontSize: 13 }}
                      placeholder="https://example.com/image.png"
                    />
                  </div>

                  {/* Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--void)', border: '1px solid var(--whisper)', borderRadius: 'var(--r-sm)' }}>
                    <img
                      src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&background=F0F0F0&color=6B7280&size=80`}
                      alt="Preview"
                      className="avatar"
                      style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)' }}
                    />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--parchment)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 2 }}>{profile.username || 'Username'}</p>
                      <p style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.6 }}>Vista previa del avatar</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--whisper)' }}>
                    <button type="submit" disabled={loading} className="btn btn-signal" style={{ opacity: loading ? 0.7 : 1 }}>
                      {loading ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              )}

              {tab === 'password' && (
                <form onSubmit={handlePasswordChange} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em', marginBottom: 4 }}>Cambiar Contraseña</h2>
                    <p style={{ fontSize: 12, color: 'var(--stone)' }}>Actualiza tus credenciales para mantener tu cuenta segura.</p>
                  </div>

                  {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((f) => (
                    <div key={f}>
                      <Label>{f === 'currentPassword' ? 'Contraseña actual' : f === 'newPassword' ? 'Nueva contraseña' : 'Confirmar nueva contraseña'}</Label>
                      <input
                        type="password" required
                        value={passwords[f]}
                        onChange={(e) => setPasswords((p) => ({ ...p, [f]: e.target.value }))}
                        className="input" style={{ fontSize: 13 }}
                        placeholder="••••••••"
                        minLength={f !== 'currentPassword' ? 6 : undefined}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--whisper)' }}>
                    <button type="submit" disabled={loading} className="btn btn-signal" style={{ opacity: loading ? 0.7 : 1 }}>
                      {loading ? 'Actualizando…' : 'Actualizar contraseña'}
                    </button>
                  </div>
                </form>
              )}

              {tab === 'preferences' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em', marginBottom: 4 }}>Preferencias de contenido</h2>
                    <p style={{ fontSize: 12, color: 'var(--stone)' }}>Controla qué tipo de contenido ves en la plataforma.</p>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: showNSFW ? 'rgba(239,68,68,0.06)' : 'var(--void)',
                    border: `1px solid ${showNSFW ? 'rgba(239,68,68,0.3)' : 'var(--whisper)'}`,
                    borderRadius: 'var(--r-sm)', padding: '18px 20px', transition: 'all 160ms',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <ExclamationTriangleIcon style={{ width: 18, height: 18, color: showNSFW ? '#ef4444' : 'var(--stone)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: showNSFW ? '#ef4444' : 'var(--parchment)', marginBottom: 4 }}>
                          Mostrar contenido NSFW
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--stone)', lineHeight: 1.6 }}>
                          Activa esto para ver prompts marcados como contenido adulto. Desactivado por defecto.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNSFWToggle(!showNSFW)}
                      style={{
                        flexShrink: 0, width: 44, height: 24, borderRadius: 12,
                        background: showNSFW ? '#ef4444' : 'var(--whisper)',
                        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 160ms', marginLeft: 20,
                      }}
                      aria-label="Toggle NSFW content"
                    >
                      <span style={{
                        position: 'absolute', top: 4, left: showNSFW ? 23 : 4,
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left 160ms',
                      }} />
                    </button>
                  </div>
                </div>
              )}

              {tab === 'danger' && (
                <div className="animate-fade-in">
                  <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--destructive)', letterSpacing: '-0.02em', marginBottom: 4 }}>Zona de Peligro</h2>
                  <p style={{ fontSize: 12, color: 'var(--stone)', marginBottom: 24 }}>Acciones irreversibles. Procede con cuidado.</p>

                  <div style={{ border: '1px solid rgba(224,112,112,0.2)', borderRadius: 'var(--r-md)', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <ExclamationTriangleIcon style={{ width: 16, height: 16, color: 'var(--destructive)' }} />
                      <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--destructive)' }}>Eliminar Cuenta</h3>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.65, marginBottom: 16 }}>
                      Esto eliminará permanentemente tu cuenta, todos tus prompts, valoraciones y elementos guardados. Esta acción no se puede deshacer.
                    </p>
                    <ul style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {['Todos tus prompts serán eliminados', 'Ratings y comentarios eliminados', 'Los datos del perfil no se pueden recuperar'].map((item) => (
                        <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--destructive)', opacity: 0.6, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--stone)' }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 18px', borderRadius: 'var(--r-sm)',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        background: 'transparent', border: '1px solid rgba(224,112,112,0.3)',
                        color: 'var(--destructive)', transition: 'all 150ms ease',
                        opacity: loading ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--destructive-dim)'; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; }}
                    >
                      {loading ? 'Procesando…' : 'Eliminar mi cuenta permanentemente'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
