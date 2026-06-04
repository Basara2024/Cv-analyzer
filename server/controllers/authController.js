const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/userModel");

// --- Helper: Generar JWT ---
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// --- Helper: Respuesta con token ---
const sendTokenResponse = (res, statusCode, user) => {
  const token = generateToken(user.id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
};

// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor completa todos los campos.",
      });
    }

    // Verificar email duplicado
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una cuenta con este email.",
      });
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(res, 201, user);
  } catch (error) {
    // Errores de validación de Sequelize
    if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }
    console.error("Error en register:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor ingresa email y contraseña.",
      });
    }

    // Buscar con password incluido (scope especial)
    const user = await User.scope("withPassword").findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: "Tu cuenta ha sido desactivada." });
    }

    sendTokenResponse(res, 200, user);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    console.error("Error en getMe:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByPk(req.user.id);
    if (name) user.name = name;
    await user.save();
    res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { register, login, getMe, updateProfile };
