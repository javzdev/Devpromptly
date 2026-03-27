const sgMail = require('@sendgrid/mail');

const isConfigured = !!(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);

if (isConfigured) {
  sgMail.setApiKey(process.env.EMAIL_API_KEY);
} else {
  console.warn('Email service not configured — EMAIL_API_KEY or EMAIL_FROM missing. Emails will be skipped.');
}

const APP_NAME = 'DevPromptly';
const BASE_URL = process.env.APP_URL || 'https://devpromptly.com';

/**
 * Send a password reset email.
 * @param {string} toEmail
 * @param {string} resetToken - raw token (not hashed)
 */
async function sendPasswordResetEmail(toEmail, resetToken) {
  if (!isConfigured) {
    console.warn(`[Email] Password reset skipped for ${toEmail} — email service not configured`);
    return;
  }

  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;

  const msg = {
    to: toEmail,
    from: process.env.EMAIL_FROM,
    subject: `Restablecer contraseña — ${APP_NAME}`,
    text: `Solicitaste restablecer tu contraseña en ${APP_NAME}.\n\nHaz clic en el siguiente enlace (válido por 1 hora):\n${resetUrl}\n\nSi no solicitaste esto, ignora este correo.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Restablecer contraseña</h2>
        <p>Solicitaste restablecer tu contraseña en <strong>${APP_NAME}</strong>.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#888;font-size:13px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
      </div>
    `
  };

  await sgMail.send(msg);
}

/**
 * Send an email verification email.
 * @param {string} toEmail
 * @param {string} verificationToken - raw token
 */
async function sendVerificationEmail(toEmail, verificationToken) {
  if (!isConfigured) {
    console.warn(`[Email] Verification email skipped for ${toEmail} — email service not configured`);
    return;
  }

  const verifyUrl = `${BASE_URL}/confirm-email?token=${verificationToken}`;

  const msg = {
    to: toEmail,
    from: process.env.EMAIL_FROM,
    subject: `Verifica tu email — ${APP_NAME}`,
    text: `Bienvenido a ${APP_NAME}. Verifica tu email:\n${verifyUrl}\n\nEste enlace expira en 24 horas.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verifica tu email</h2>
        <p>Bienvenido a <strong>${APP_NAME}</strong>. Solo un paso más.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
            Verificar email
          </a>
        </p>
        <p style="color:#888;font-size:13px;">Este enlace expira en 24 horas.</p>
      </div>
    `
  };

  await sgMail.send(msg);
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
