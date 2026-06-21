const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, socialLogin } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { changePassword } = require("../controllers/settingsController");

// Rutas públicas
router.post("/register", register);
router.post("/login", login);
router.post("/social-login", socialLogin);

// Rutas protegidas
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
