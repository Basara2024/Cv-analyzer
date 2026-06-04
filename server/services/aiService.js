const Anthropic = require("@anthropic-ai/sdk");

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "pendiente") {
    const err = new Error("ANTHROPIC_API_KEY no configurada");
    err.code = "INVALID_API_KEY";
    throw err;
  }
  return new Anthropic({ apiKey });
};

const parseJsonFromAI = (raw) => {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
};

const analyzeWithAI = async (cvText) => {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Eres un experto en recursos humanos y reclutamiento. Analiza el siguiente CV y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código, sin explicaciones.

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
${cvText}`,
      },
    ],
  });

  const raw = message.content[0].text.trim();
  return parseJsonFromAI(raw);
};

module.exports = { analyzeWithAI };
