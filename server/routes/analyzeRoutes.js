const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { validatePDF } = require("../middleware/fileValidation");
const { checkAnalysisLimit } = require("../middleware/analysisLimits");
const { analyzeCV, getHistory, getAnalysis, deleteAnalysis } = require("../controllers/analyzeController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Solo se aceptan archivos PDF"), false);
    }
    if (!file.originalname.toLowerCase().endsWith(".pdf")) {
      return cb(new Error("El archivo debe tener extensión .pdf"), false);
    }
    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single("cv")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "El archivo excede el tamaño máximo de 10MB." });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Analizar CV — con todas las capas de validación y límites
router.post("/", protect, checkAnalysisLimit, handleUpload, validatePDF, analyzeCV);

// Historial
router.get("/history", protect, getHistory);

// Obtener análisis específico
router.get("/:id", protect, getAnalysis);

// Eliminar análisis
router.delete("/:id", protect, deleteAnalysis);

module.exports = router;
