const prisma = require("../config/db");
const { notifyTeamMemberAdded } = require("../services/notificationService");

const checkOrgAccess = async (userId, orgId, allowedRoles = ["owner", "admin", "recruiter"]) => {
  const member = await prisma.org_members.findFirst({
    where: { org_id: parseInt(orgId), user_id: userId, is_active: true },
  });
  if (!member || !allowedRoles.includes(member.role)) return null;
  return member;
};

const createOrganization = async (req, res) => {
  try {
    const { name, nit, economic_activity, country, city, size } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "El nombre es obligatorio." });

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 50);
    const existing = await prisma.organizations.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

    const org = await prisma.organizations.create({
      data: { owner_id: req.user.id, name, slug, nit, economic_activity, country: country || "Colombia", city, size },
    });

    await prisma.org_members.create({
      data: { org_id: org.id, user_id: req.user.id, role: "owner" },
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { plan: "business" },
    });

    res.status(201).json({ success: true, organization: org });
  } catch (error) {
    console.error("Error en createOrganization:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const getMyOrganization = async (req, res) => {
  try {
    const member = await prisma.org_members.findFirst({
      where: { user_id: req.user.id, is_active: true },
      include: { organizations: true },
    });
    if (!member) return res.status(404).json({ success: false, message: "No perteneces a ninguna organización." });
    res.status(200).json({ success: true, organization: member.organizations, role: member.role });
  } catch (error) {
    console.error("Error en getMyOrganization:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const getMembers = async (req, res) => {
  try {
    const member = await checkOrgAccess(req.user.id, req.params.orgId, ["owner", "admin"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const members = await prisma.org_members.findMany({
      where: { org_id: parseInt(req.params.orgId), is_active: true },
      include: { users: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });
    res.status(200).json({ success: true, members });
  } catch (error) {
    console.error("Error en getMembers:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const addMember = async (req, res) => {
  try {
    const member = await checkOrgAccess(req.user.id, req.params.orgId, ["owner", "admin"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: "Nombre y email son obligatorios." });

    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      const bcrypt = require("bcryptjs");
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashed = await bcrypt.hash(tempPassword, 12);
      user = await prisma.user.create({
        data: { name, email: email.toLowerCase(), password: hashed, provider: "email" },
      });
    }

    const existing = await prisma.org_members.findFirst({
      where: { org_id: parseInt(req.params.orgId), user_id: user.id },
    });
    if (existing) return res.status(409).json({ success: false, message: "Este usuario ya es miembro." });

    const newMember = await prisma.org_members.create({
      data: { org_id: parseInt(req.params.orgId), user_id: user.id, role: role || "recruiter" },
    });

    notifyTeamMemberAdded({
      orgId: req.params.orgId,
      addedBy: req.user.id,
      adderName: req.user.name,
      memberName: user.name,
      memberUserId: user.id,
      role: role || "recruiter",
    }).catch((err) => console.error("Error creando notificación de equipo:", err.message));

    res.status(201).json({ success: true, member: newMember });
  } catch (error) {
    console.error("Error en addMember:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const removeMember = async (req, res) => {
  try {
    const member = await checkOrgAccess(req.user.id, req.params.orgId, ["owner", "admin"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    await prisma.org_members.updateMany({
      where: { org_id: parseInt(req.params.orgId), user_id: parseInt(req.params.userId) },
      data: { is_active: false },
    });
    res.status(200).json({ success: true, message: "Miembro eliminado." });
  } catch (error) {
    console.error("Error en removeMember:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const member = await checkOrgAccess(req.user.id, req.params.orgId, ["owner", "admin"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { role } = req.body;
    if (!["owner", "admin", "recruiter"].includes(role)) {
      return res.status(400).json({ success: false, message: "Rol inválido." });
    }

    // Evitar que alguien se quite a sí mismo el último acceso de admin/owner
    const targetMember = await prisma.org_members.findFirst({
      where: { org_id: parseInt(req.params.orgId), user_id: parseInt(req.params.userId) },
    });
    if (!targetMember) {
      return res.status(404).json({ success: false, message: "Miembro no encontrado." });
    }

    const updated = await prisma.org_members.update({
      where: { id: targetMember.id },
      data: { role },
    });

    res.status(200).json({ success: true, member: updated });
  } catch (error) {
    console.error("Error en updateMemberRole:", error);
    res.status(500).json({ success: false, message: "Error al actualizar el rol." });
  }
};

module.exports = { createOrganization, getMyOrganization, getMembers, addMember, removeMember, updateMemberRole, checkOrgAccess };
