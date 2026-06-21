const prisma = require("../config/db");
const { checkOrgAccess } = require("./organizationController");
const { notifyCampaignSent } = require("../services/notificationService");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Plantilla predefinida — la empresa solo llena variables específicas
const buildEmailHTML = ({ candidateName, positionTitle, companyName, customMessage }) => `
<div style="font-family: -apple-system, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <div style="background: #2563eb; height: 4px; border-radius: 4px; margin-bottom: 32px;"></div>

  <p style="font-size: 15px; line-height: 1.6;">Hola <strong>${candidateName}</strong>,</p>

  <p style="font-size: 15px; line-height: 1.6;">
    En <strong>${companyName}</strong> recordamos tu perfil de procesos anteriores y queremos contarte que tenemos una nueva oportunidad que podría interesarte:
  </p>

  <div style="background: #f4f6fb; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
    <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px;">Posición disponible</p>
    <p style="font-size: 18px; font-weight: 700; color: #2563eb; margin: 0;">${positionTitle}</p>
  </div>

  ${customMessage ? `<p style="font-size: 15px; line-height: 1.6;">${customMessage}</p>` : ""}

  <p style="font-size: 15px; line-height: 1.6;">
    Si te interesa retomar el proceso, simplemente responde a este correo y con gusto coordinamos los siguientes pasos.
  </p>

  <p style="font-size: 15px; line-height: 1.6; margin-top: 28px;">
    Saludos,<br/>
    <strong>Equipo de Reclutamiento — ${companyName}</strong>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
  <p style="font-size: 11px; color: #9ca3af;">Este correo fue enviado a través de Matchia en nombre de ${companyName}.</p>
</div>
`;

// @route POST /api/organizations/:orgId/campaigns
// Crear campaña (borrador)
const createCampaign = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { job_position_id, subject, custom_message, candidate_ids } = req.body;

    if (!job_position_id || !subject || !candidate_ids || candidate_ids.length === 0) {
      return res.status(400).json({ success: false, message: "Puesto, asunto y al menos un candidato son obligatorios." });
    }
    if (candidate_ids.length > 30) {
      return res.status(400).json({ success: false, message: "Máximo 30 candidatos por campaña." });
    }

    const campaign = await prisma.email_campaigns.create({
      data: {
        org_id: parseInt(orgId),
        created_by: req.user.id,
        job_position_id: parseInt(job_position_id),
        subject,
        body: custom_message || "",
        status: "draft",
      },
    });

    // Crear destinatarios
    const candidates = await prisma.candidates.findMany({
      where: { id: { in: candidate_ids.map((id) => parseInt(id)) } },
    });

    const recipients = candidates.filter((c) => c.email);
    await prisma.campaign_recipients.createMany({
      data: recipients.map((c) => ({
        campaign_id: campaign.id,
        candidate_id: c.id,
        email: c.email,
      })),
    });

    res.status(201).json({ success: true, campaign, recipientsCount: recipients.length });
  } catch (error) {
    console.error("Error en createCampaign:", error);
    res.status(500).json({ success: false, message: "Error al crear la campaña." });
  }
};

// @route POST /api/organizations/:orgId/campaigns/:campaignId/send
const sendCampaign = async (req, res) => {
  try {
    const { orgId, campaignId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const campaign = await prisma.email_campaigns.findUnique({
      where: { id: parseInt(campaignId) },
      include: { job_positions: true, organizations: true },
    });

    if (!campaign) return res.status(404).json({ success: false, message: "Campaña no encontrada." });

    const recipients = await prisma.campaign_recipients.findMany({
      where: { campaign_id: campaign.id, status: "pending" },
      include: { candidates: true },
    });

    let sentCount = 0;

    for (const recipient of recipients) {
      try {
        const html = buildEmailHTML({
          candidateName: recipient.candidates.name || "candidato/a",
          positionTitle: campaign.job_positions?.title || "una nueva posición",
          companyName: campaign.organizations.name,
          customMessage: campaign.body,
        });

        await resend.emails.send({
          from: "Matchia <reclutamiento@matchia.co>",
          to: recipient.email,
          subject: campaign.subject,
          html,
        });

        await prisma.campaign_recipients.update({
          where: { id: recipient.id },
          data: { status: "sent", sent_at: new Date() },
        });
        sentCount++;
      } catch (err) {
        console.error(`Error enviando a ${recipient.email}:`, err.message);
        await prisma.campaign_recipients.update({
          where: { id: recipient.id },
          data: { status: "failed" },
        });
      }
    }

    await prisma.email_campaigns.update({
      where: { id: campaign.id },
      data: { status: "sent", sent_at: new Date(), total_sent: sentCount },
    });

    notifyCampaignSent({
      orgId,
      sentBy: req.user.id,
      senderName: req.user.name,
      subject: campaign.subject,
      sentCount,
    }).catch((err) => console.error("Error creando notificación de campaña:", err.message));

    res.status(200).json({ success: true, sentCount, total: recipients.length });
  } catch (error) {
    console.error("Error en sendCampaign:", error);
    res.status(500).json({ success: false, message: "Error al enviar la campaña." });
  }
};

// @route GET /api/organizations/:orgId/campaigns
const getCampaigns = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const campaigns = await prisma.email_campaigns.findMany({
      where: { org_id: parseInt(orgId) },
      include: {
        job_positions: { select: { title: true } },
        _count: { select: { campaign_recipients: true } },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ success: true, campaigns });
  } catch (error) {
    console.error("Error en getCampaigns:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

// @route GET /api/organizations/:orgId/campaigns/suggested-candidates
// Sugiere los mejores 30 candidatos descartados similares a un puesto
const getSuggestedCandidates = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const candidates = await prisma.candidates.findMany({
      where: {
        org_id: parseInt(orgId),
        OR: [{ in_pool: true }, { status: "descartado" }],
        email: { not: null },
      },
      orderBy: { individual_score: "desc" },
      take: 30,
    });

    res.status(200).json({ success: true, candidates });
  } catch (error) {
    console.error("Error en getSuggestedCandidates:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { createCampaign, sendCampaign, getCampaigns, getSuggestedCandidates };
