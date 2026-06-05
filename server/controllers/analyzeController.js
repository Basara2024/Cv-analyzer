const pdfParse = require("pdf-parse");
const { analyzeWithAI } = require("../services/aiService");
const prisma = require("../config/db");

// @route POST /api/analyze
const analyzeCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Por favor sube un archivo PDF." });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const cvText = pdfData.text.trim();

    if (!cvText || cvText.length < 100) {
      return res.status(400).json({
        success: false,
        message: "No se pudo extraer texto del PDF. Asegúrate de que no sea una imagen escaneada.",
      });
    }

    const analysis = await analyzeWithAI(cvText);

    // Guardar en Supabase
    await prisma.analysis.create({
      data: {
        user_id: req.user.id,
        file_name: req.file.originalname,
        puntuacion_general: analysis.puntuacion_general,
        resumen: analysis.resumen,
        resultado_json: analysis,
      },
    });

    // Actualizar contador del usuario
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        analysis_count: { increment: 1 },
        last_analysis: new Date(),
      },
    });

    res.status(200).json({ success: true, analysis });
  } catch (error) {
    console.error("Error en analyzeCV:", error);
    if (error instanceof SyntaxError) {
      return res.status(500).json({ success: false, message: "Error procesando la respuesta de la IA." });
    }
    res.status(500).json({ success: false, message: "Error al analizar el CV. Intenta de nuevo." });
  }
};

// @route GET /api/analyze/history
const getHistory = async (req, res) => {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { user_id: req.user.id },
      select: {
        id: true,
        file_name: true,
        puntuacion_general: true,
        resumen: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ success: true, analyses });
  } catch (error) {
    console.error("Error en getHistory:", error);
    res.status(500).json({ success: false, message: "Error al obtener el historial." });
  }
};

// @route GET /api/analyze/:id
const getAnalysis = async (req, res) => {
  try {
    const analysis = await prisma.analysis.findFirst({
      where: { id: parseInt(req.params.id), user_id: req.user.id },
    });

    if (!analysis) {
      return res.status(404).json({ success: false, message: "Análisis no encontrado." });
    }

    res.status(200).json({ success: true, analysis: analysis.resultado_json });
  } catch (error) {
    console.error("Error en getAnalysis:", error);
    res.status(500).json({ success: false, message: "Error al obtener el análisis." });
  }
};

module.exports = { analyzeCV, getHistory, getAnalysis };
