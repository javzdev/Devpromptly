import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';
import api from '../services/api';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ prompts: any[]; tools: any[]; communities: any[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSearchResults(null); setSearchOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(value.trim())}`);
        setSearchResults(res.data);
        setSearchOpen(true);
      } catch {}
    }, 300);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/prompts?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const goTo = (path: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const hasResults = searchResults && (
    searchResults.prompts.length + searchResults.tools.length + searchResults.communities.length > 0
  );

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header
      style={{
        background: 'var(--ink)',
        borderBottom: '1px solid var(--whisper)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo — DevPromptly */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <img
              src={require('../Logo/logo_principal.png')}
              alt="DevPromptly"
              style={{ height: 80, marginTop: 4, marginBottom: 4 }}
            />
          </Link>

          {/* Search — Desktop */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xs mx-10" style={{ position: 'relative' }}>
            <form onSubmit={handleSearch} style={{ width: '100%' }}>
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                  style={{ color: 'var(--dust)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => { if (searchResults && hasResults) setSearchOpen(true); }}
                  placeholder="Buscar prompts, herramientas, comunidades..."
                  className="input pl-9 py-2 text-xs"
                  style={{ fontSize: 12 }}
                  autoComplete="off"
                />
              </div>
            </form>

            {/* Results dropdown */}
            {searchOpen && (
              <div
                className="animate-scale-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: 'var(--carbon)',
                  border: '1px solid var(--whisper)',
                  borderRadius: 'var(--r-lg)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                  zIndex: 200,
                  overflow: 'hidden',
                  transformOrigin: 'top center',
                  maxHeight: 'min(480px, calc(100vh - 80px))',
                }}
              >
                {!hasResults ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--stone)' }}>
                    Sin resultados para "{searchQuery}"
                  </div>
                ) : (
                  <div style={{ overflowY: 'auto', maxHeight: 'min(480px, calc(100vh - 80px))' }}>
                    {searchResults!.prompts.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SparklesIcon style={{ width: 10, height: 10, color: 'var(--signal)' }} />
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Prompts</span>
                        </div>
                        {searchResults!.prompts.map((p) => (
                          <button key={p._id} onClick={() => goTo(`/prompts/${p._id}`)}
                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--parchment)' }}>{p.title}</span>
                            <span style={{ fontSize: 11, color: 'var(--stone)' }}>{p.category} · {p.aiTool}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults!.tools.length > 0 && (
                      <div style={{ borderTop: searchResults!.prompts.length > 0 ? '1px solid var(--whisper)' : undefined }}>
                        <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <WrenchScrewdriverIcon style={{ width: 10, height: 10, color: 'var(--signal)' }} />
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tools</span>
                        </div>
                        {searchResults!.tools.map((t) => (
                          <button key={t._id} onClick={() => goTo('/tools')}
                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--parchment)' }}>{t.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--stone)' }}>{t.category}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults!.communities.length > 0 && (
                      <div style={{ borderTop: (searchResults!.prompts.length + searchResults!.tools.length) > 0 ? '1px solid var(--whisper)' : undefined }}>
                        <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UserGroupIcon style={{ width: 10, height: 10, color: 'var(--signal)' }} />
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Communities</span>
                        </div>
                        {searchResults!.communities.map((c) => (
                          <button key={c._id} onClick={() => goTo('/forums')}
                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--parchment)' }}>{c.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--stone)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 240 }}>{c.description}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--whisper)', padding: '6px 14px 8px' }}>
                      <button onClick={() => goTo(`/prompts?search=${encodeURIComponent(searchQuery)}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--stone)', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <MagnifyingGlassIcon style={{ width: 11, height: 11 }} />
                        Ver todos los resultados para "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav — Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/prompts"
              className={`nav-link ${isActive('/prompts') ? 'active' : ''}`}
            >
              Explorar
            </Link>
            <Link
              to="/forums"
              className={`nav-link ${isActive('/forums') ? 'active' : ''}`}
            >
              Comunidades
            </Link>
            <Link
              to="/tools"
              className={`nav-link ${isActive('/tools') ? 'active' : ''}`}
            >
              Herramientas
            </Link>
            <Link
              to="/blog"
              className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
            >
              Blog
            </Link>

            <div
              style={{
                width: 1,
                height: 18,
                background: 'var(--whisper)',
                margin: '0 8px',
              }}
            />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/create"
                  className="btn btn-signal"
                  style={{ padding: '7px 14px', gap: 6, fontSize: 12 }}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Compartir prompt
                </Link>

                <NotificationBell />

                {/* Avatar + dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="avatar-btn"
                  >
                    <img
                      src={
                        user?.avatar ||
                        `https://ui-avatars.com/api/?name=${user?.username}&background=F0F0F0&color=6B7280&bold=true&size=64`
                      }
                      alt={user?.username}
                      className="avatar"
                      style={{ width: 26, height: 26 }}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0"
                        style={{ zIndex: 40 }}
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div
                        className="dropdown animate-scale-in absolute right-0 mt-1"
                        style={{ width: 200, zIndex: 50, transformOrigin: 'top right' }}
                      >
                        <div
                          style={{
                            padding: '12px 16px 10px',
                            borderBottom: '1px solid var(--whisper)',
                          }}
                        >
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--parchment)',
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}
                          >
                            {user?.username}
                          </p>
                          <p
                            style={{ fontSize: 11, color: 'var(--dust)' }}
                            className="truncate"
                          >
                            {user?.email}
                          </p>
                        </div>
                        <div style={{ padding: '4px 0' }}>
                          {[
                            { to: `/profile/${user?.username}`, label: 'Perfil' },
                            { to: '/my-prompts', label: 'Mis Prompts' },
                            { to: '/favorites', label: 'Guardados' },
                          ].map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="dropdown-item"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                          {['admin', 'moderator'].includes(user?.role || '') && (
                            <Link
                              to="/admin"
                              className="dropdown-item"
                              style={{ color: 'var(--signal)' }}
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              Admin
                            </Link>
                          )}
                          <Link
                            to="/settings"
                            className="dropdown-item"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Configuración
                          </Link>
                        </div>
                        <div
                          style={{ borderTop: '1px solid var(--whisper)', padding: '4px 0' }}
                        >
                          <button
                            onClick={handleLogout}
                            className="dropdown-item w-full text-left"
                            style={{ color: 'var(--destructive)' }}
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>
                  Iniciar sesión
                </Link>
                <Link to="/register" className="btn btn-signal" style={{ padding: '7px 14px', fontSize: 12 }}>
                  Empezar
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            style={{ color: 'var(--stone)', padding: 6 }}
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden animate-fade-in"
          style={{ borderTop: '1px solid var(--whisper)', padding: '16px 20px 20px' }}
        >
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: 'var(--dust)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar prompts..."
                className="input pl-9"
                style={{ fontSize: 13 }}
              />
            </div>
          </form>

          <div className="flex flex-col gap-1">
            <Link
              to="/prompts"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`nav-link ${isActive('/prompts') ? 'active' : ''}`}
            >
              Explorar
            </Link>
            <Link
              to="/forums"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`nav-link ${isActive('/forums') ? 'active' : ''}`}
            >
              Comunidades
            </Link>
            <Link
              to="/tools"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`nav-link ${isActive('/tools') ? 'active' : ''}`}
            >
              Herramientas
            </Link>
            <Link
              to="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
            >
              Blog
            </Link>

            <div style={{ height: 1, background: 'var(--whisper)', margin: '8px 0' }} />

            {isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="nav-link"
                  style={{ color: 'var(--signal)' }}
                >
                  + Compartir prompt
                </Link>
                <Link to={`/profile/${user?.username}`} onClick={() => setIsMobileMenuOpen(false)} className="nav-link">
                  Perfil
                </Link>
                <Link to="/my-prompts" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">
                  Mis Prompts
                </Link>
                <button
                  onClick={handleLogout}
                  className="nav-link text-left"
                  style={{ color: 'var(--destructive)' }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'center' }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn btn-signal"
                  style={{ justifyContent: 'center' }}
                >
                  Empezar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
