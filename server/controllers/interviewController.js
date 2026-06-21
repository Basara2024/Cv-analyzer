const prisma = require("../config/db");
const { checkOrgAccess } = require("./organizationController");
const {
  notifyInterviewScheduled,
  notifyInterviewUpdated,
  notifyInterviewCancelled,
} = require("../services/notificationService");

// @route POST /api/organizations/:orgId/interviews
const createInterview = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { candidate_id, job_position_id, interviewer_id, interview_type, scheduled_at, duration_minutes, notes_before } = req.body;

    if (!candidate_id || !interviewer_id || !scheduled_at) {
      return res.status(400).json({ success: false, message: "Candidato, entrevistador y fecha son obligatorios." });
    }

    const interview = await prisma.interviews.create({
      data: {
        org_id: parseInt(orgId),
        candidate_id: parseInt(candidate_id),
        job_position_id: job_position_id ? parseInt(job_position_id) : null,
        interviewer_id: parseInt(interviewer_id),
        created_by: req.user.id,
        interview_type: interview_type || "rh",
        scheduled_at: new Date(scheduled_at),
        duration_minutes: duration_minutes || 30,
        notes_before,
      },
      include: {
        candidates: { select: { name: true } },
        job_positions: { select: { title: true } },
      },
    });

    notifyInterviewScheduled({
      interview,
      orgId,
      createdBy: req.user.id,
      creatorName: req.user.name,
      candidateName: interview.candidates?.name,
      positionTitle: interview.job_positions?.title,
    }).catch((err) => console.error("Error creando notificación de entrevista:", err.message));

    res.status(201).json({ success: true, interview });
  } catch (error) {
    console.error("Error en createInterview:", error);
    res.status(500).json({ success: false, message: "Error al agendar la entrevista." });
  }
};

// @route GET /api/organizations/:orgId/interviews
const getInterviews = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { status, interviewer_id, mine } = req.query;
    const where = { org_id: parseInt(orgId) };
    if (status) where.status = status;
    if (interviewer_id) where.interviewer_id = parseInt(interviewer_id);
    if (mine === "true") where.interviewer_id = req.user.id;

    const interviews = await prisma.interviews.findMany({
      where,
      include: {
        candidates: { select: { id: true, name: true, email: true, file_name: true, analysis_result: true, individual_score: true, ranking_score: true } },
        job_positions: { select: { id: true, title: true } },
        users_interviews_interviewer_idTousers: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduled_at: "asc" },
    });

    res.status(200).json({ success: true, interviews });
  } catch (error) {
    console.error("Error en getInterviews:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route PUT /api/organizations/:orgId/interviews/:interviewId
const updateInterview = async (req, res) => {
  try {
    const { orgId, interviewId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { scheduled_at, interview_type, interviewer_id, notes_before, feedback, evaluation_score, status } = req.body;

    const existing = await prisma.interviews.findUnique({
      where: { id: parseInt(interviewId) },
      include: {
        candidates: { select: { name: true } },
        job_positions: { select: { title: true } },
      },
    });
    if (!existing || existing.org_id !== parseInt(orgId)) {
      return res.status(404).json({ success: false, message: "Entrevista no encontrada." });
    }

    const data = {};
    const changes = [];
    if (scheduled_at) {
      data.scheduled_at = new Date(scheduled_at);
      changes.push("la fecha");
    }
    if (interview_type) {
      data.interview_type = interview_type;
      changes.push("el tipo");
    }
    if (interviewer_id) {
      data.interviewer_id = parseInt(interviewer_id);
      changes.push("el entrevistador");
    }
    if (notes_before !== undefined) data.notes_before = notes_before;
    if (feedback !== undefined) data.feedback = feedback;
    if (evaluation_score !== undefined) data.evaluation_score = evaluation_score;
    if (status) {
      data.status = status;
      changes.push("el estado");
    }

    const interview = await prisma.interviews.update({
      where: { id: parseInt(interviewId) },
      data,
    });

    if (changes.length > 0) {
      notifyInterviewUpdated({
        interview,
        orgId,
        updatedBy: req.user.id,
        updaterName: req.user.name,
        candidateName: existing.candidates?.name,
        changes,
      }).catch((err) => console.error("Error creando notificación de actualización:", err.message));
    }

    res.status(200).json({ success: true, interview });
  } catch (error) {
    console.error("Error en updateInterview:", error);
    res.status(500).json({ success: false, message: "Error al actualizar la entrevista." });
  }
};

// @route DELETE /api/organizations/:orgId/interviews/:interviewId
const deleteInterview = async (req, res) => {
  try {
    const { orgId, interviewId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const interview = await prisma.interviews.findUnique({
      where: { id: parseInt(interviewId) },
      include: { candidates: { select: { name: true } } },
    });

    if (!interview || interview.org_id !== parseInt(orgId)) {
      return res.status(404).json({ success: false, message: "Entrevista no encontrada." });
    }

    await prisma.interviews.delete({ where: { id: parseInt(interviewId) } });

    notifyInterviewCancelled({
      interview,
      orgId,
      deletedBy: req.user.id,
      deleterName: req.user.name,
      candidateName: interview.candidates?.name,
    }).catch((err) => console.error("Error creando notificación de cancelación:", err.message));

    res.status(200).json({ success: true, message: "Entrevista eliminada." });
  } catch (error) {
    console.error("Error en deleteInterview:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { createInterview, getInterviews, updateInterview, deleteInterview };
