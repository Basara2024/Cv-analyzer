const prisma = require("../config/db");

// Límites por tipo de proveedor
const LIMITS = {
  email: 1,
  google: 3,
  twitter: 3,
  linkedin: 3,
  pro: Infinity,
};

// Cooldown entre análisis (30 minutos en plan free)
const FREE_COOLDOWN_MS = 30 * 60 * 1000;

// Tiempo de bloqueo al agotar tries (24 horas)
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000;

// Rate limit por IP (5 requests por hora)
const ipRequests = new Map();
const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;

const checkAnalysisLimit = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Plan Pro — sin límites
    if (user.plan === "pro") return next();

    // --- Rate limit por IP ---
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    const now = Date.now();
    const ipData = ipRequests.get(ip) || { count: 0, resetAt: now + IP_WINDOW_MS };

    if (now > ipData.resetAt) {
      ipData.count = 0;
      ipData.resetAt = now + IP_WINDOW_MS;
    }

    ipData.count++;
    ipRequests.set(ip, ipData);

    if (ipData.count > IP_LIMIT) {
      const waitMinutes = Math.ceil((ipData.resetAt - now) / 60000);
      return res.status(429).json({
        success: false,
        message: `Demasiadas solicitudes desde tu red. Intenta en ${waitMinutes} minutos.`,
        code: "IP_RATE_LIMIT",
      });
    }

    // --- Verificar si está bloqueado por agotar tries ---
    if (user.free_blocked_until && new Date(user.free_blocked_until) > new Date()) {
      const unblockTime = new Date(user.free_blocked_until);
      const hoursLeft = Math.ceil((unblockTime - new Date()) / 3600000);
      return res.status(403).json({
        success: false,
        message: `Has agotado tus análisis gratuitos. Podrás volver a intentarlo en ${hoursLeft} horas o actualiza a Pro para acceso ilimitado.`,
        code: "BLOCKED",
        unblockAt: unblockTime,
      });
    }

    // --- Verificar límite de análisis ---
    const limit = LIMITS[user.provider] || LIMITS.email;
    if (user.analyses_used >= limit) {
      // Bloquear por 24 horas
      await prisma.user.update({
        where: { id: user.id },
        data: { free_blocked_until: new Date(now + BLOCK_DURATION_MS) },
      });

      return res.status(403).json({
        success: false,
        message: `Has usado todos tus análisis gratuitos (${limit}). Actualiza a Pro para acceso ilimitado.`,
        code: "LIMIT_REACHED",
        limit,
        used: user.analyses_used,
      });
    }

    // --- Cooldown entre análisis (plan free) ---
    if (user.last_analysis_at) {
      const lastAnalysis = new Date(user.last_analysis_at).getTime();
      const timeSinceLast = now - lastAnalysis;

      if (timeSinceLast < FREE_COOLDOWN_MS) {
        const waitMinutes = Math.ceil((FREE_COOLDOWN_MS - timeSinceLast) / 60000);
        return res.status(429).json({
          success: false,
          message: `Debes esperar ${waitMinutes} minutos entre análisis en el plan gratuito.`,
          code: "COOLDOWN",
          waitMinutes,
        });
      }
    }

    // Adjuntar datos del usuario y límites al request
    req.userLimits = {
      limit,
      used: user.analyses_used,
      remaining: limit - user.analyses_used,
    };

    next();
  } catch (error) {
    console.error("Error en checkAnalysisLimit:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { checkAnalysisLimit };
