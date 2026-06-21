const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createPreference, webhook, getSubscriptionStatus } = require("../controllers/paymentController");

router.post("/create-preference", protect, createPreference);
router.post("/webhook", webhook); // Sin protect — MercadoPago llama esto directamente
router.get("/status", protect, getSubscriptionStatus);

module.exports = router;
