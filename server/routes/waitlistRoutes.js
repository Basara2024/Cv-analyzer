const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

router.post("/", async (req, res) => {
  try {
    const { email, name, interest } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "El email es obligatorio." });
    }

    const existing = await prisma.waitlist.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Ya estás en la lista de espera.",
        alreadyRegistered: true,
      });
    }

    await prisma.waitlist.create({
      data: {
        email: email.toLowerCase(),
        name,
        interest,
      },
    });

    res.status(201).json({ success: true, message: "Te agregamos a la lista de espera." });
  } catch (error) {
    console.error("Error en waitlist:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});

module.exports = router;
