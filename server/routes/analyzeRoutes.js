const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { analyzeCV, getHistory, getAnalysis, deleteAnalysis } = require("../controllers/analyzeController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se aceptan archivos PDF"), false);
    }
  },
});

// Analizar CV
router.post("/", protect, upload.single("cv"), analyzeCV);

// Historial de análisis
router.get("/history", protect, getHistory);

// Obtener análisis específico
router.get("/:id", protect, getAnalysis);

// Eliminar análisis
router.delete("/:id", protect, deleteAnalysis);

module.exports = router;
