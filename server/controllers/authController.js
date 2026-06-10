const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");

const PROVIDER_LIMITS = {
  email: 1,
  google: 3,
  twitter: 3,
  linkedin: 3,
};

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
      plan: user.plan,
      analysisCount: user.analysis_count,
      analysesUsed: user.analyses_used,
      analysesLimit: user.analyses_limit,
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
        analyses_limit: PROVIDER_LIMITS.email,
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

// @route POST /api/auth/social-login
const socialLogin = async (req, res) => {
  try {
    const { name, email, provider, provider_id, avatar_url } = req.body;

    if (!provider || !provider_id) {
      return res.status(400).json({ success: false, message: "Datos del proveedor incompletos." });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { provider_id: String(provider_id) },
          { email: email?.toLowerCase() },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || "Usuario",
          email: email?.toLowerCase() || `${provider_id}@${provider}.com`,
          provider,
          provider_id: String(provider_id),
          avatar_url,
          analyses_limit: PROVIDER_LIMITS[provider] || PROVIDER_LIMITS.email,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar_url, provider_id: String(provider_id) },
      });
    }

    sendTokenResponse(res, 200, user);
  } catch (error) {
    console.error("Error en socialLogin:", error);
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
        plan: user.plan,
        analysisCount: user.analysis_count,
        analysesUsed: user.analyses_used,
        analysesLimit: user.analyses_limit,
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { register, login, getMe, updateProfile, socialLogin };
