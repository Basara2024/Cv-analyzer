const verifyRecaptcha = async (req, res, next) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

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

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        message: "Verificación reCAPTCHA fallida. Intenta de nuevo.",
      });
    }

    // reCAPTCHA v3 incluye score (0.0–1.0). v2 no lo envía.
    if (typeof data.score === "number") {
      const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
      if (data.score < minScore) {
        return res.status(400).json({
          success: false,
          message: "No pudimos verificar que eres humano. Intenta de nuevo.",
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
