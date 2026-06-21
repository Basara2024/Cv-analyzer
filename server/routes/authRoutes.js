const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, socialLogin } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { verifyRecaptcha } = require("../middleware/verifyRecaptcha");
const { changePassword } = require("../controllers/settingsController");
const { forgotPassword, resetPassword } = require("../controllers/passwordResetController");

// Rutas públicas
router.post("/register", verifyRecaptcha, register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login", login);
router.post("/social-login", socialLogin);

// Rutas protegidas
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
