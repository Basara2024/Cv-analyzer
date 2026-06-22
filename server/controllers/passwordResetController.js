const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_TOKEN_EXPIRY_MINUTES = 30;

const buildResetEmailHTML = (resetLink, userName) => `
<div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <div style="background: #2563eb; height: 4px; border-radius: 4px; margin-bottom: 32px;"></div>

  <p style="font-size: 15px; line-height: 1.6;">Hola ${userName || ""},</p>

  <p style="font-size: 15px; line-height: 1.6;">
    Recibimos una solicitud para restablecer tu contraseña en Matchia. Haz clic en el siguiente botón para crear una nueva:
  </p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="${resetLink}" style="background: #2563eb; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
      Restablecer contraseña
    </a>
  </div>

  <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
    Este enlace expira en ${RESET_TOKEN_EXPIRY_MINUTES} minutos. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;" />
  <p style="font-size: 11px; color: #9ca3af;">Matchia — análisis inteligente de CVs</p>
</div>
`;

// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Ingresa tu correo electrónico." });
    }

    const user = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });

    // Respuesta genérica siempre — no revelar si el email existe o no (seguridad)
    const genericResponse = {
      success: true,
      message: "Si el correo está registrado, recibirás un enlace de recuperación en breve.",
    };

    if (!user || !user.password) {
      // Usuario no existe o se registró por OAuth (sin contraseña que recuperar)
      return res.status(200).json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.password_reset_tokens.create({
      data: { user_id: user.id, token, expires_at: expiresAt },
    });

    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;

    await resend.emails.send({
      from: "Matchia <reclutamiento@matchia.co>",
      to: user.email,
      subject: "Recupera tu contraseña — Matchia",
      html: buildResetEmailHTML(resetLink, user.name),
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token y nueva contraseña son obligatorios." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres." });
    }

    const resetToken = await prisma.password_reset_tokens.findUnique({ where: { token } });

    if (!resetToken || resetToken.used || new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "El enlace es inválido o ha expirado. Solicita uno nuevo." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.users.update({
      where: { id: resetToken.user_id },
      data: { password: hashedPassword },
    });

    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    res.status(200).json({ success: true, message: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { forgotPassword, resetPassword };
