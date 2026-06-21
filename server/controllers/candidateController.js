const prisma = require("../config/db");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const { checkOrgAccess } = require("./organizationController");
const { notifyCandidatesUploaded } = require("../services/notificationService");

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

    if (analyzedCandidates.length > 0) {
      notifyCandidatesUploaded({
        orgId,
        uploadedBy: req.user.id,
        uploaderName: req.user.name,
        count: analyzedCandidates.length,
        positionTitle: jobDescription ? jobDescription.split(":")[0] : null,
      }).catch((err) => console.error("Error creando notificación de candidatos:", err.message));
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

// @route GET /api/organizations/:orgId/pool
const getPool = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { skill, min_experience, nivel, search } = req.query;

    // Pool = candidatos marcados como in_pool O descartados (disponibles para reutilizar)
    const candidates = await prisma.candidates.findMany({
      where: {
        org_id: parseInt(orgId),
        OR: [{ in_pool: true }, { status: "descartado" }],
      },
      include: {
        job_positions: { select: { id: true, title: true } },
        candidate_notes: { include: { users: { select: { name: true } } }, orderBy: { created_at: "desc" } },
      },
      orderBy: { individual_score: "desc" },
    });

    // Filtros sobre el JSON de análisis (se hacen en memoria porque son campos JSONB)
    let filtered = candidates;

    if (skill) {
      const skillLower = skill.toLowerCase();
      filtered = filtered.filter((c) =>
        c.analysis_result?.habilidades_clave?.some((s) => s.toLowerCase().includes(skillLower))
      );
    }

    if (nivel) {
      filtered = filtered.filter((c) => c.analysis_result?.nivel === nivel);
    }

    if (min_experience) {
      const minExp = parseInt(min_experience);
      filtered = filtered.filter((c) => (c.analysis_result?.experiencia_anos || 0) >= minExp);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({ success: true, candidates: filtered, total: filtered.length });
  } catch (error) {
    console.error("Error en getPool:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route PUT /api/organizations/:orgId/candidates/:candidateId/add-to-position
const addToPosition = async (req, res) => {
  try {
    const { orgId, candidateId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { job_position_id } = req.body;
    if (!job_position_id) {
      return res.status(400).json({ success: false, message: "Debes indicar el puesto." });
    }

    const candidate = await prisma.candidates.update({
      where: { id: parseInt(candidateId) },
      data: {
        job_position_id: parseInt(job_position_id),
        status: "en_revision",
        in_pool: false,
      },
    });

    res.status(200).json({ success: true, candidate });
  } catch (error) {
    console.error("Error en addToPosition:", error);
    res.status(500).json({ success: false, message: "Error al mover el candidato." });
  }
};

module.exports = { bulkAnalyze, getCandidates, updateCandidate, addNote, getPool, addToPosition };
