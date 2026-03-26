import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: 48, paddingBottom: 80 }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div style={{ marginBottom: 40 }}>
          <span className="mono-label" style={{ marginBottom: 8 }}>Legal</span>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--parchment)', letterSpacing: '-0.025em', marginBottom: 8 }}>
            Política de Privacidad
          </h1>
          <p style={{ fontSize: 13, color: 'var(--stone)' }}>Última actualización: marzo 2025</p>
        </div>

        <div className="card" style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>1. Información que recopilamos</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              Cuando te registras en DevPromptly, recopilamos la siguiente información:
            </p>
            <ul style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 2, paddingLeft: 20, marginTop: 8 }}>
              <li>Nombre de usuario y dirección de correo electrónico</li>
              <li>Contraseña (almacenada de forma encriptada)</li>
              <li>Prompts, comentarios y contenido que publicas voluntariamente</li>
              <li>Datos de uso como páginas visitadas y búsquedas realizadas</li>
            </ul>
          </section>

          <div style={{ height: 1, background: 'var(--whisper)' }} />

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>2. Cómo usamos tu información</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              Utilizamos la información recopilada para:
            </p>
            <ul style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 2, paddingLeft: 20, marginTop: 8 }}>
              <li>Proveer y mejorar los servicios de la plataforma</li>
              <li>Gestionar tu cuenta y autenticación</li>
              <li>Permitir la interacción entre usuarios de la comunidad</li>
              <li>Enviar notificaciones relacionadas con tu actividad (si las has activado)</li>
              <li>Mostrar publicidad relevante a través de Google AdSense</li>
            </ul>
          </section>

          <div style={{ height: 1, background: 'var(--whisper)' }} />

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>3. Google AdSense y cookies</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              DevPromptly utiliza Google AdSense para mostrar anuncios. Google puede usar cookies para personalizar los anuncios que ves según tu actividad en la web. Puedes consultar la política de privacidad de Google en{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)' }}>
                policies.google.com/privacy
              </a>.
            </p>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8, marginTop: 12 }}>
              Utilizamos cookies propias para mantener tu sesión iniciada y recordar tus preferencias. Al usar este sitio, aceptas el uso de cookies.
            </p>
          </section>

          <div style={{ height: 1, background: 'var(--whisper)' }} />

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>4. Compartir información con terceros</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              No vendemos ni alquilamos tu información personal a terceros. Podemos compartir datos con proveedores de servicios necesarios para operar la plataforma (como almacenamiento en la nube o servicios de correo), siempre bajo acuerdos de confidencialidad.
            </p>
          </section>

          <div style={{ height: 1, background: 'var(--whisper)' }} />

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>5. Seguridad de los datos</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              Implementamos medidas de seguridad razonables para proteger tu información, incluyendo encriptación de contraseñas y comunicaciones HTTPS. Sin embargo, ningún sistema es completamente seguro y no podemos garantizar seguridad absoluta.
            </p>
          </section>

          <div style={{ height: 1, background: 'var(--whisper)' }} />

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>6. Tus derechos</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              Tienes derecho a acceder, corregir o eliminar tu información personal. Para ejercer estos derechos, contáctanos a través de nuestras redes sociales o desde la configuración de tu cuenta.
            </p>
          </section>

          <div style={{ height: 1, background: 'var(--whisper)' }} />

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>7. Cambios a esta política</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos publicando la nueva versión en esta página con la fecha de actualización.
            </p>
          </section>

          <div style={{ height: 1, background: 'var(--whisper)' }} />

          <section>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--parchment)', marginBottom: 12 }}>8. Contacto</h2>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.8 }}>
              Si tienes preguntas sobre esta política de privacidad, puedes contactarnos a través de nuestras redes sociales en{' '}
              <a href="https://www.instagram.com/javzdev_/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)' }}>
                @javzdev_
              </a>.
            </p>
          </section>

        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--stone)', textDecoration: 'none' }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
