const RECAPTCHA_ERROR_MESSAGES = {
  "missing-input-secret": "Configuración reCAPTCHA incorrecta en el servidor.",
  "invalid-input-secret": "Clave secreta de reCAPTCHA inválida en el servidor.",
  "missing-input-response": "Falta la verificación anti-bot. Recarga la página e intenta de nuevo.",
  "invalid-input-response":
    "Token reCAPTCHA inválido o expirado. Recarga la página e intenta de nuevo.",
  "bad-request": "Solicitud reCAPTCHA inválida.",
  "timeout-or-duplicate": "La verificación expiró. Intenta registrarte de nuevo.",
  "browser-error":
    "Este dominio no está autorizado en reCAPTCHA. Agrega localhost o matchia.co en Google reCAPTCHA Admin.",
};

const verifyRecaptcha = async (req, res, next) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim();

  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ RECAPTCHA_SECRET_KEY no configurada — registro sin verificación anti-bot.");
      return next();
    }
    return res.status(503).json({
      success: false,
      message: "Verificación anti-bot no disponible. Contacta al soporte.",
    });
  }

  const token = req.body.recaptchaToken;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Completa la verificación anti-bot antes de registrarte.",
    });
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    if (req.ip) {
      params.append("remoteip", req.ip);
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.success) {
      const errorCode = data["error-codes"]?.[0];
      console.error("reCAPTCHA rechazado:", data["error-codes"], "hostname:", data.hostname);

      return res.status(400).json({
        success: false,
        message:
          RECAPTCHA_ERROR_MESSAGES[errorCode] ||
          "Verificación reCAPTCHA fallida. Intenta de nuevo.",
      });
    }

    if (data.action && data.action !== "register") {
      console.warn("reCAPTCHA action inesperada:", data.action);
      return res.status(400).json({
        success: false,
        message: "Verificación anti-bot inválida. Intenta de nuevo.",
      });
    }

    if (typeof data.score === "number") {
      const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.3");
      console.log(`reCAPTCHA OK — score: ${data.score}, hostname: ${data.hostname}`);

      if (data.score < minScore) {
        return res.status(400).json({
          success: false,
          message: `No pudimos verificar que eres humano (score: ${data.score.toFixed(2)}). Intenta de nuevo.`,
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error verificando reCAPTCHA:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar reCAPTCHA. Intenta de nuevo.",
    });
  }
};

module.exports = { verifyRecaptcha };
