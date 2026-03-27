const { Resend } = require('resend');

const isConfigured = !!(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);

let resend;
if (isConfigured) {
  resend = new Resend(process.env.EMAIL_API_KEY);
  console.info(`[Email] Service configured — FROM: ${process.env.EMAIL_FROM}`);
} else {
  console.warn(`[Email] NOT configured — EMAIL_API_KEY: ${!!process.env.EMAIL_API_KEY}, EMAIL_FROM: ${!!process.env.EMAIL_FROM}`);
}

const APP_NAME = 'DevPromptly';
const BASE_URL = process.env.APP_URL || 'https://javzdev.com';
const LOGO_URL = `${BASE_URL}/logo_email.png`;

async function sendPasswordResetEmail(toEmail, resetToken) {
  if (!isConfigured) {
    console.warn(`[Email] Password reset skipped for ${toEmail} — email service not configured`);
    return;
  }

  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: `Restablecer contraseña — ${APP_NAME}`,
      headers: {
        'X-Entity-Ref-ID': `reset-${Date.now()}`,
        'List-Unsubscribe': `<mailto:noreply@javzdev.com>`,
      },
      text: `Solicitaste restablecer tu contraseña en ${APP_NAME}.\n\nHaz clic en el siguiente enlace (válido por 1 hora):\n${resetUrl}\n\nSi no solicitaste esto, ignora este correo.`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0C0C0E; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #13131A; padding: 28px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 48px; max-width: 180px;" />
          </div>
          <div style="padding: 36px 32px;">
            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #F2EDE4; letter-spacing: -0.02em;">Restablecer contraseña</h2>
            <p style="margin: 0 0 24px; font-size: 14px; color: #8A8A9A; line-height: 1.6;">Solicitaste restablecer tu contraseña en <strong style="color: #F2EDE4;">${APP_NAME}</strong>. Haz clic en el botón para continuar.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#E8B84B;color:#0C0C0E;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
              Restablecer contraseña
            </a>
            <p style="margin: 24px 0 0; font-size: 12px; color: #5A5A6A; line-height: 1.5;">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, puedes ignorar este correo.</p>
          </div>
          <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #4A4A5A;">${APP_NAME} · <a href="${BASE_URL}" style="color: #6A6A7A; text-decoration: none;">javzdev.com</a></p>
          </div>
        </div>
      `
    });
    console.info(`[Email] Password reset email sent to ${toEmail}`);
  } catch (err) {
    console.error(`[Email] Resend error:`, err?.message || err);
    throw err;
  }
}

async function sendVerificationEmail(toEmail, verificationToken) {
  if (!isConfigured) {
    console.warn(`[Email] Verification email skipped for ${toEmail} — email service not configured`);
    return;
  }

  const verifyUrl = `${BASE_URL}/confirm-email?token=${verificationToken}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: `Activa tu cuenta — ${APP_NAME}`,
      headers: {
        'X-Entity-Ref-ID': `verify-${Date.now()}`,
        'List-Unsubscribe': `<mailto:noreply@javzdev.com>`,
      },
      text: `Bienvenido a ${APP_NAME}. Activa tu cuenta aquí:\n${verifyUrl}\n\nEste enlace expira en 24 horas.`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0C0C0E; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #13131A; padding: 28px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 48px; max-width: 180px;" />
          </div>
          <div style="padding: 36px 32px;">
            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #F2EDE4; letter-spacing: -0.02em;">Activa tu cuenta</h2>
            <p style="margin: 0 0 24px; font-size: 14px; color: #8A8A9A; line-height: 1.6;">Bienvenido a <strong style="color: #F2EDE4;">${APP_NAME}</strong>. Solo un paso más para empezar a explorar y compartir prompts.</p>
            <a href="${verifyUrl}" target="_self" style="display:inline-block;padding:12px 28px;background:#E8B84B;color:#0C0C0E;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
              Activar cuenta
            </a>
            <p style="margin: 24px 0 0; font-size: 12px; color: #5A5A6A; line-height: 1.5;">Este enlace expira en <strong>24 horas</strong>. Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </div>
          <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #4A4A5A;">${APP_NAME} · <a href="${BASE_URL}" style="color: #6A6A7A; text-decoration: none;">javzdev.com</a></p>
          </div>
        </div>
      `
    });
    console.info(`[Email] Verification email sent to ${toEmail}`);
  } catch (err) {
    console.error(`[Email] Resend error:`, err?.message || err);
    throw err;
  }
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
