const prisma = require("../config/db");
const { checkOrgAccess } = require("./organizationController");

// @route GET /api/organizations/:orgId/reports
const getReports = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const orgIdInt = parseInt(orgId);
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const candidateWhere = { org_id: orgIdInt };
    if (from || to) candidateWhere.created_at = dateFilter;

    const candidates = await prisma.candidates.findMany({
      where: candidateWhere,
      include: { job_positions: { select: { id: true, title: true, created_at: true } } },
    });

    const interviews = await prisma.interviews.findMany({
      where: { org_id: orgIdInt, ...(from || to ? { scheduled_at: dateFilter } : {}) },
      include: { users_interviews_interviewer_idTousers: { select: { id: true, name: true } } },
    });

    // ===== 1. Embudo de conversión =====
    const funnel = {
      en_revision: candidates.filter((c) => c.status === "en_revision").length,
      entrevista: interviews.length > 0 ? new Set(interviews.map((i) => i.candidate_id)).size : 0,
      seleccionado: candidates.filter((c) => c.status === "seleccionado").length,
      descartado: candidates.filter((c) => c.status === "descartado").length,
    };

    // ===== 2. Tiempo promedio de contratación por puesto =====
    const selectedCandidates = candidates.filter((c) => c.status === "seleccionado" && c.job_positions);
    const positionTimes = {};
    selectedCandidates.forEach((c) => {
      const posId = c.job_positions.id;
      const days = Math.round((new Date(c.updated_at) - new Date(c.job_positions.created_at)) / (1000 * 60 * 60 * 24));
      if (!positionTimes[posId]) positionTimes[posId] = { title: c.job_positions.title, times: [] };
      positionTimes[posId].times.push(Math.max(days, 0));
    });
    const avgTimeByPosition = Object.values(positionTimes).map((p) => ({
      title: p.title,
      avgDays: Math.round(p.times.reduce((a, b) => a + b, 0) / p.times.length),
    }));
    const overallAvgDays = selectedCandidates.length > 0
      ? Math.round(
          selectedCandidates.reduce((sum, c) => {
            const days = (new Date(c.updated_at) - new Date(c.job_positions.created_at)) / (1000 * 60 * 60 * 24);
            return sum + Math.max(days, 0);
          }, 0) / selectedCandidates.length
        )
      : 0;

    // ===== 3. Tasa de reutilización del pool =====
    const totalSelected = candidates.filter((c) => c.status === "seleccionado").length;
    const reusedFromPool = candidates.filter((c) => c.status === "seleccionado" && c.in_pool === false && c.job_position_id && c.updated_at && c.created_at && c.updated_at !== c.created_at).length;
    // Aproximación: candidatos que fueron movidos de pool (tienen status seleccionado pero su análisis original es de otro proceso)
    const poolReuseRate = totalSelected > 0 ? Math.round((reusedFromPool / totalSelected) * 100) : 0;

    // ===== 4. Rendimiento por reclutador =====
    const recruiterStats = {};
    candidates.forEach((c) => {
      const uploaderId = c.uploaded_by;
      if (!uploaderId) return;
      if (!recruiterStats[uploaderId]) recruiterStats[uploaderId] = { total: 0, seleccionados: 0 };
      recruiterStats[uploaderId].total++;
      if (c.status === "seleccionado") recruiterStats[uploaderId].seleccionados++;
    });

    const uploaderIds = Object.keys(recruiterStats).map((id) => parseInt(id));
    const recruiterUsers = uploaderIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, name: true } })
      : [];

    const recruiterPerformance = recruiterUsers.map((u) => ({
      name: u.name,
      totalAnalizados: recruiterStats[u.id]?.total || 0,
      seleccionados: recruiterStats[u.id]?.seleccionados || 0,
    }));

    // ===== 5. Evaluación promedio de entrevistas =====
    const completedInterviews = interviews.filter((i) => i.status === "realizada" && i.evaluation_score);
    const avgInterviewScore = completedInterviews.length > 0
      ? Math.round((completedInterviews.reduce((sum, i) => sum + i.evaluation_score, 0) / completedInterviews.length) * 10) / 10
      : 0;

    const interviewsByInterviewer = {};
    completedInterviews.forEach((i) => {
      const name = i.users_interviews_interviewer_idTousers?.name || "Sin asignar";
      if (!interviewsByInterviewer[name]) interviewsByInterviewer[name] = { total: 0, sum: 0 };
      interviewsByInterviewer[name].total++;
      interviewsByInterviewer[name].sum += i.evaluation_score;
    });
    const interviewerStats = Object.entries(interviewsByInterviewer).map(([name, data]) => ({
      name,
      totalEntrevistas: data.total,
      promedioEvaluacion: Math.round((data.sum / data.total) * 10) / 10,
    }));

    res.status(200).json({
      success: true,
      report: {
        funnel,
        hiringTime: {
          overallAvgDays,
          byPosition: avgTimeByPosition,
        },
        poolReuseRate,
        recruiterPerformance,
        interviews: {
          totalCompleted: completedInterviews.length,
          totalScheduled: interviews.length,
          avgScore: avgInterviewScore,
          byInterviewer: interviewerStats,
        },
      },
    });
  } catch (error) {
    console.error("Error en getReports:", error);
    res.status(500).json({ success: false, message: "Error al generar el reporte." });
  }
};

module.exports = { getReports };
