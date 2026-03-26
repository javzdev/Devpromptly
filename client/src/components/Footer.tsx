import React from 'react';
import { Link } from 'react-router-dom';

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer style={{ background: 'var(--ink)', borderTop: '1px solid var(--whisper)', paddingTop: 40, paddingBottom: 32 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-block', marginBottom: 12 }}>
              <img
                src={require('../Logo/logo_principal.png')}
                alt="DevPromptly"
                style={{ height: 40 }}
              />
            </Link>
            <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.7, maxWidth: 220 }}>
              La comunidad de prompts e inteligencia artificial para desarrolladores y creativos.
            </p>
          </div>

          {/* Links */}
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Plataforma</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { to: '/prompts', label: 'Explorar prompts' },
                { to: '/tools', label: 'Herramientas IA' },
                { to: '/forums', label: 'Comunidades' },
                { to: '/blog', label: 'Blog' },
              ].map((item) => (
                <Link key={item.to} to={item.to} style={{ fontSize: 13, color: 'var(--stone)', textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--parchment)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--stone)')}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Legal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/privacy" style={{ fontSize: 13, color: 'var(--stone)', textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--parchment)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--stone)')}
              >
                Política de Privacidad
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--stone)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Síguenos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a
                href="https://www.facebook.com/profile.php?id=61585452197946&locale=es_LA"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--stone)', textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--parchment)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--stone)')}
              >
                <FacebookIcon /> Facebook
              </a>
              <a
                href="https://www.tiktok.com/@javzdev?is_from_webapp=1&sender_device=pc"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--stone)', textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--parchment)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--stone)')}
              >
                <TikTokIcon /> TikTok
              </a>
              <a
                href="https://www.instagram.com/javzdev_/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--stone)', textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--parchment)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--stone)')}
              >
                <InstagramIcon /> Instagram
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--whisper)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--stone)', opacity: 0.5 }}>
            © {new Date().getFullYear()} DevPromptly. Todos los derechos reservados.
          </p>
          <Link to="/privacy" style={{ fontSize: 12, color: 'var(--stone)', opacity: 0.5, textDecoration: 'none', transition: 'opacity 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
          >
            Política de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
