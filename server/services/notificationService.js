const prisma = require("../config/db");

const formatDate = (date) =>
  new Date(date).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

const getAdminUserIds = async (orgId, excludeUserId = null) => {
  const members = await prisma.org_members.findMany({
    where: {
      org_id: parseInt(orgId),
      is_active: true,
      role: { in: ["owner", "admin"] },
      ...(excludeUserId ? { user_id: { not: excludeUserId } } : {}),
    },
    select: { user_id: true },
  });
  return members.map((m) => m.user_id);
};

const notifyMany = async (userIds, payload) => {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;

  await prisma.notifications.createMany({
    data: unique.map((userId) => ({
      org_id: parseInt(payload.orgId),
      user_id: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || null,
      metadata: payload.metadata || null,
    })),
  });
};

const notifyInterviewScheduled = async ({
  interview,
  orgId,
  createdBy,
  creatorName,
  candidateName,
  positionTitle,
}) => {
  const dateStr = formatDate(interview.scheduled_at);
  const candidate = candidateName || "un candidato";
  const position = positionTitle ? ` (${positionTitle})` : "";
  const recipients = new Set();

  if (interview.interviewer_id !== createdBy) {
    recipients.add(interview.interviewer_id);
  }

  const admins = await getAdminUserIds(orgId, createdBy);
  admins.forEach((id) => recipients.add(id));

  await notifyMany([...recipients], {
    orgId,
    type: "interview_scheduled",
    title: "Nueva entrevista agendada",
    message: `${creatorName || "Un reclutador"} agendó una entrevista con ${candidate}${position} para el ${dateStr}.`,
    link: "/business/interviews",
    metadata: { interview_id: interview.id },
  });
};

const notifyInterviewUpdated = async ({
  interview,
  orgId,
  updatedBy,
  updaterName,
  candidateName,
  changes,
}) => {
  const recipients = new Set([interview.interviewer_id]);
  if (updatedBy !== interview.interviewer_id) {
    const admins = await getAdminUserIds(orgId, updatedBy);
    admins.forEach((id) => recipients.add(id));
  }

  const changeText = changes.length ? changes.join(", ") : "datos de la entrevista";
  await notifyMany([...recipients], {
    orgId,
    type: "interview_updated",
    title: "Entrevista actualizada",
    message: `${updaterName || "Un reclutador"} actualizó ${changeText} con ${candidateName || "un candidato"}.`,
    link: "/business/interviews",
    metadata: { interview_id: interview.id },
  });
};

const notifyInterviewCancelled = async ({
  interview,
  orgId,
  deletedBy,
  deleterName,
  candidateName,
}) => {
  const recipients = new Set([interview.interviewer_id]);
  const admins = await getAdminUserIds(orgId, deletedBy);
  admins.forEach((id) => recipients.add(id));

  await notifyMany([...recipients], {
    orgId,
    type: "interview_cancelled",
    title: "Entrevista cancelada",
    message: `${deleterName || "Un reclutador"} canceló la entrevista con ${candidateName || "un candidato"}.`,
    link: "/business/interviews",
    metadata: { interview_id: interview.id },
  });
};

const notifyCandidatesUploaded = async ({ orgId, uploadedBy, uploaderName, count, positionTitle }) => {
  const admins = await getAdminUserIds(orgId, uploadedBy);
  const recipients = new Set(admins);

  if (!recipients.size) return;

  const position = positionTitle ? ` para ${positionTitle}` : "";
  await notifyMany([...recipients], {
    orgId,
    type: "candidates_uploaded",
    title: "Nuevos candidatos analizados",
    message: `${uploaderName || "Un reclutador"} subió ${count} CV${count === 1 ? "" : "s"}${position}.`,
    link: "/business/candidates",
    metadata: { count },
  });
};

const notifyTeamMemberAdded = async ({ orgId, addedBy, adderName, memberName, memberUserId, role }) => {
  const roleLabel = role || "reclutador";

  if (memberUserId && memberUserId !== addedBy) {
    await notifyMany([memberUserId], {
      orgId,
      type: "team_member_added",
      title: "Te agregaron al equipo",
      message: `${adderName || "Un administrador"} te agregó al equipo como ${roleLabel}.`,
      link: "/business/dashboard",
      metadata: { role },
    });
  }

  const adminIds = (await getAdminUserIds(orgId, addedBy)).filter((id) => id !== memberUserId);
  if (adminIds.length) {
    await notifyMany(adminIds, {
      orgId,
      type: "team_member_added",
      title: "Nuevo miembro en el equipo",
      message: `${adderName || "Un administrador"} agregó a ${memberName} como ${roleLabel}.`,
      link: "/business/team",
      metadata: { role },
    });
  }
};

const notifyCampaignSent = async ({ orgId, sentBy, senderName, subject, sentCount }) => {
  const recipients = new Set(await getAdminUserIds(orgId));
  if (sentBy) recipients.add(sentBy);

  await notifyMany([...recipients], {
    orgId,
    type: "campaign_sent",
    title: "Campaña de email enviada",
    message: `${senderName || "Un reclutador"} envió la campaña "${subject}" a ${sentCount} candidato${sentCount === 1 ? "" : "s"}.`,
    link: "/business/campaigns",
    metadata: { sentCount },
  });
};

module.exports = {
  notifyInterviewScheduled,
  notifyInterviewUpdated,
  notifyInterviewCancelled,
  notifyCandidatesUploaded,
  notifyTeamMemberAdded,
  notifyCampaignSent,
};
