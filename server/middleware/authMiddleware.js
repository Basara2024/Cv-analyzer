const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No autorizado. Por favor inicia sesión.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // findByPk usa el id primario (INTEGER en MySQL)
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "El usuario asociado a este token ya no existe.",
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Tu cuenta ha sido desactivada. Contacta al soporte.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Token inválido." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
      });
    }
    return res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción.",
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
