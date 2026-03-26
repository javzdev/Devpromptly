import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields'); return false;
    }
    if (formData.username.length < 3) { toast.error('Username must be at least 3 characters'); return false; }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) { toast.error('Username: letters, numbers, underscores only'); return false; }
    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register(formData.username, formData.email, formData.password);
      toast.success('Account created');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const Field: React.FC<{
    label: string;
    name: string;
    type: string;
    placeholder: string;
    icon: React.ElementType;
    value: string;
    extra?: React.ReactNode;
  }> = ({ label, name, type, placeholder, icon: Icon, value, extra }) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--stone)', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--stone)', opacity: 0.5 }} />
        <input
          name={name}
          type={type}
          required
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="input"
          style={{ paddingLeft: 36, paddingRight: extra ? 40 : undefined }}
        />
        {extra}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--void)' }}
    >
      <div
        style={{
          position: 'fixed',
          top: '15%', right: '20%',
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(232,184,75,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="w-full max-w-sm animate-fade-up" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div style={{ width: 40, height: 40, background: 'var(--signal)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: 'var(--void)' }}>G</span>
            </div>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Create an account
              </h1>
              <p style={{ fontSize: 13, color: 'var(--stone)' }}>Join the prompt community</p>
            </div>
          </Link>
        </div>

        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Username" name="username" type="text" placeholder="johndoe" icon={UserIcon} value={formData.username} />
            <Field label="Email" name="email" type="email" placeholder="you@example.com" icon={EnvelopeIcon} value={formData.email} />

            {/* Password with toggle */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--stone)', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--stone)', opacity: 0.5 }} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {showPassword ? <EyeSlashIcon style={{ width: 14, height: 14 }} /> : <EyeIcon style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--stone)', marginBottom: 6 }}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--stone)', opacity: 0.5 }} />
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <input type="checkbox" required id="terms" style={{ marginTop: 2, accentColor: 'var(--signal)', width: 13, height: 13, flexShrink: 0 }} />
              <label htmlFor="terms" style={{ fontSize: 11, color: 'var(--stone)', lineHeight: 1.5 }}>
                I agree to the{' '}
                <span style={{ color: 'var(--signal)' }}>Terms</span> and{' '}
                <span style={{ color: 'var(--signal)' }}>Privacy Policy</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-signal"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <><div className="spinner" style={{ width: 14, height: 14 }} />Creating account…</>
              ) : 'Create account'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--whisper)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--stone)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--signal)', fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
