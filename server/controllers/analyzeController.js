const { extractPdfText } = require("../utils/extractPdfText");
const { analyzeWithAI } = require("../services/aiService");
const User = require("../models/userModel");

const analyzeCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Por favor sube un archivo PDF.",
      });
    }

    const cvText = await extractPdfText(req.file.buffer);

    if (!cvText || cvText.length < 100) {
      return res.status(400).json({
        success: false,
        message:
          "No se pudo extraer texto del PDF. Asegúrate de que no sea una imagen escaneada.",
      });
    }

    const analysis = await analyzeWithAI(cvText);

    await User.update(
      {
        analysis_count: req.user.analysis_count + 1,
        last_analysis: new Date(),
      },
      { where: { id: req.user.id } }
    );

    const user = await User.findByPk(req.user.id);

    res.status(200).json({
      success: true,
      analysis,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Error en analyzeCV:", error);

    if (error.code === "INVALID_API_KEY" || error.status === 401) {
      return res.status(503).json({
        success: false,
        message: "Configura ANTHROPIC_API_KEY en el archivo .env del servidor.",
      });
    }

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        message: "Error procesando la respuesta de la IA. Intenta de nuevo.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error al analizar el CV. Intenta de nuevo.",
    });
  }
};

module.exports = { analyzeCV };
