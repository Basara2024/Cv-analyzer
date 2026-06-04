const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const { analyzeWithAI } = require("../services/aiService");
const User = require("../models/userModel");
const Analysis = require("../models/analysisModel");

const analyzeCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Por favor sube un archivo PDF.",
      });
    }

    // Extraer texto del PDF
    const pdfData = await pdfParse(req.file.buffer);
    const cvText = pdfData.text.trim();

    if (!cvText || cvText.length < 100) {
      return res.status(400).json({
        success: false,
        message: "No se pudo extraer texto del PDF. Asegúrate de que no sea una imagen escaneada.",
      });
    }

    // Analizar con IA
    const analysis = await analyzeWithAI(cvText);

    // Guardar análisis en la base de datos
    await Analysis.create({
      user_id: req.user.id,
      file_name: req.file.originalname,
      puntuacion_general: analysis.puntuacion_general,
      resumen: analysis.resumen,
      resultado_json: analysis,
    });

    // Actualizar contador del usuario
    await User.update(
      {
        analysis_count: req.user.analysis_count + 1,
        last_analysis: new Date(),
      },
      { where: { id: req.user.id } }
    );

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Error en analyzeCV:", error);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        message: "Error procesando la respuesta de la IA. Intenta de nuevo.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al analizar el CV. Intenta de nuevo.",
    });
  }
};

// Obtener historial de análisis del usuario
const getHistory = async (req, res) => {
  try {
    const analyses = await Analysis.findAll({
      where: { user_id: req.user.id },
      attributes: ["id", "file_name", "puntuacion_general", "resumen", "created_at"],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error("Error en getHistory:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial.",
    });
  }
};

// Obtener un análisis específico por ID
const getAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Análisis no encontrado.",
      });
    }

    res.status(200).json({
      success: true,
      analysis: analysis.resultado_json,
    });
  } catch (error) {
    console.error("Error en getAnalysis:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el análisis.",
    });
  }
};

module.exports = { analyzeCV, getHistory, getAnalysis };
