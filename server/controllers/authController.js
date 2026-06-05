const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sendTokenResponse = (res, statusCode, user) => {
  const token = generateToken(user.id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      analysisCount: user.analysis_count,
      lastAnalysis: user.last_analysis,
      avatarUrl: user.avatar_url,
    },
  });
};

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Por favor completa todos los campos." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres." });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Ya existe una cuenta con este email." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        provider: "email",
      },
    });

    sendTokenResponse(res, 201, user);
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Por favor ingresa email y contraseña." });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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

// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        analysisCount: user.analysis_count,
        lastAnalysis: user.last_analysis,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Error en getMe:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route PUT /api/auth/update-profile
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
    });
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { register, login, getMe, updateProfile };
