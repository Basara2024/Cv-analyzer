const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { analyzeCV } = require("../controllers/analyzeController");

const router = express.Router();

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

router.post("/", protect, (req, res, next) => {
  upload.single("cv")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "El archivo supera el límite de 10MB.",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, analyzeCV);

module.exports = router;
