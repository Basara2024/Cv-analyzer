const axios = require("axios");

const analyzeWithAI = async (cvText) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Eres un experto en recursos humanos y reclutamiento. Analiza el siguiente CV y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código, sin explicaciones.
El JSON debe tener exactamente esta estructura:
{
  "puntuacion_general": <número del 1 al 100>,
  "resumen": "<resumen breve del perfil en 2-3 oraciones>",
  "categorias": {
    "formato_presentacion": {
      "puntuacion": <número del 1 al 100>,
      "feedback": "<feedback específico>",
      "mejoras": ["<mejora 1>", "<mejora 2>"]
    },
    "experiencia_laboral": {
      "puntuacion": <número del 1 al 100>,
      "feedback": "<feedback específico>",
      "mejoras": ["<mejora 1>", "<mejora 2>"]
    },
    "educacion": {
      "puntuacion": <número del 1 al 100>,
      "feedback": "<feedback específico>",
      "mejoras": ["<mejora 1>", "<mejora 2>"]
    },
    "habilidades": {
      "puntuacion": <número del 1 al 100>,
      "feedback": "<feedback específico>",
      "mejoras": ["<mejora 1>", "<mejora 2>"]
    },
    "impacto_logros": {
      "puntuacion": <número del 1 al 100>,
      "feedback": "<feedback específico>",
      "mejoras": ["<mejora 1>", "<mejora 2>"]
    }
  },
  "fortalezas": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "areas_criticas": ["<área 1>", "<área 2>"]
}
CV a analizar:
${cvText}`
              }
            ]
          }
        ]
      }
    );

    const text = response.data.candidates[0].content.parts[0].text.trim();
    const clean = text.replace(/\`\`\`json|\`\`\`/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed;

  } catch (error) {
    console.error("Gemini error completo:", JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

module.exports = { analyzeWithAI };