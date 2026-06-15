const prisma = require("../config/db");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const { checkOrgAccess } = require("./organizationController");

// Analizar un CV con Gemini
const analyzeCV = async (cvText) => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: `Eres un experto en recursos humanos. Analiza el siguiente CV y responde ÚNICAMENTE con JSON válido sin texto adicional.

{
  "name": "<nombre del candidato>",
  "email": "<email si aparece, sino null>",
  "puntuacion_general": <1-100>,
  "resumen": "<resumen 2-3 oraciones>",
  "habilidades_clave": ["<habilidad 1>", "<habilidad 2>", "<habilidad 3>"],
  "experiencia_anos": <número aproximado>,
  "nivel": "<junior|mid|senior>",
  "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
  "areas_mejora": ["<área 1>", "<área 2>"]
}

CV:
${cvText}` }] }]
    }
  );
  const text = response.data.candidates[0].content.parts[0].text.trim();
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};

// Rankear candidatos contra descripción del puesto
const rankCandidates = async (candidates, jobDescription) => {
  const summaries = candidates.map((c, i) =>
    `Candidato ${i + 1}: ${c.analysis_result?.resumen || ""} | Habilidades: ${c.analysis_result?.habilidades_clave?.join(", ") || ""} | Nivel: ${c.analysis_result?.nivel || ""}`
  ).join("\n");

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: `Eres un experto en reclutamiento. Dado el siguiente puesto de trabajo y los candidatos, asigna un ranking del 1 al 5 (5=mejor fit) a cada candidato. Responde ÚNICAMENTE con JSON.

Puesto: ${jobDescription}

Candidatos:
${summaries}

Responde con este formato exacto:
{
  "rankings": [
    {"candidato": 1, "ranking": <1-5>, "justificacion": "<razón breve>"},
    ...
  ]
}` }] }]
    }
  );
  const text = response.data.candidates[0].content.parts[0].text.trim();
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};

// @route POST /api/organizations/:orgId/candidates/bulk
const bulkAnalyze = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { job_position_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No se subieron archivos." });
    }
    if (files.length > 20) {
      return res.status(400).json({ success: false, message: "Máximo 20 CVs por análisis." });
    }

    // Obtener descripción del puesto
    let jobDescription = "";
    if (job_position_id) {
      const position = await prisma.job_positions.findUnique({ where: { id: parseInt(job_position_id) } });
      if (position) jobDescription = `${position.title}: ${position.description}`;
    }

    // Analizar cada CV
    const analyzedCandidates = [];
    for (const file of files) {
      try {
        const pdfData = await pdfParse(file.buffer);
        const cvText = pdfData.text.trim();
        if (cvText.length < 50) continue;

        const analysis = await analyzeCV(cvText);

        const candidate = await prisma.candidates.create({
          data: {
            org_id: parseInt(orgId),
            job_position_id: job_position_id ? parseInt(job_position_id) : null,
            uploaded_by: req.user.id,
            name: analysis.name || file.originalname,
            email: analysis.email,
            file_name: file.originalname,
            cv_text: cvText,
            analysis_result: analysis,
            individual_score: analysis.puntuacion_general,
          },
        });
        analyzedCandidates.push(candidate);
      } catch (err) {
        console.error(`Error analizando ${file.originalname}:`, err.message);
      }
    }

    // Rankear si hay descripción del puesto
    if (jobDescription && analyzedCandidates.length > 1) {
      try {
        const rankings = await rankCandidates(analyzedCandidates, jobDescription);
        for (const r of rankings.rankings) {
          const candidate = analyzedCandidates[r.candidato - 1];
          if (candidate) {
            await prisma.candidates.update({
              where: { id: candidate.id },
              data: { ranking_score: r.ranking },
            });
            candidate.ranking_score = r.ranking;
          }
        }
      } catch (err) {
        console.error("Error en rankeo:", err.message);
      }
    }

    res.status(200).json({ success: true, candidates: analyzedCandidates, total: analyzedCandidates.length });
  } catch (error) {
    console.error("Error en bulkAnalyze:", error);
    res.status(500).json({ success: false, message: "Error al analizar los CVs." });
  }
};

// @route GET /api/organizations/:orgId/candidates
const getCandidates = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { job_position_id, status, in_pool } = req.query;
    const where = { org_id: parseInt(orgId) };
    if (job_position_id) where.job_position_id = parseInt(job_position_id);
    if (status) where.status = status;
    if (in_pool !== undefined) where.in_pool = in_pool === "true";

    const candidates = await prisma.candidates.findMany({
      where,
      include: { candidate_notes: { include: { users: { select: { name: true } } }, orderBy: { created_at: "desc" } } },
      orderBy: [{ ranking_score: "desc" }, { individual_score: "desc" }],
    });
    res.status(200).json({ success: true, candidates });
  } catch (error) {
    console.error("Error en getCandidates:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route PUT /api/organizations/:orgId/candidates/:candidateId
const updateCandidate = async (req, res) => {
  try {
    const { orgId, candidateId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { status, in_pool } = req.body;
    const candidate = await prisma.candidates.update({
      where: { id: parseInt(candidateId) },
      data: { status, in_pool },
    });
    res.status(200).json({ success: true, candidate });
  } catch (error) {
    console.error("Error en updateCandidate:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route POST /api/organizations/:orgId/candidates/:candidateId/notes
const addNote = async (req, res) => {
  try {
    const { orgId, candidateId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "El contenido es obligatorio." });

    const note = await prisma.candidate_notes.create({
      data: { candidate_id: parseInt(candidateId), author_id: req.user.id, content },
    });
    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("Error en addNote:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { bulkAnalyze, getCandidates, updateCandidate, addNote };
