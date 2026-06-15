const prisma = require("../config/db");
const { checkOrgAccess } = require("./organizationController");

const createJobPosition = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { title, description, requirements, salary_range, location } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Título y descripción son obligatorios." });
    }

    const position = await prisma.job_positions.create({
      data: { org_id: parseInt(orgId), created_by: req.user.id, title, description, requirements, salary_range, location },
    });
    res.status(201).json({ success: true, position });
  } catch (error) {
    console.error("Error en createJobPosition:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const getJobPositions = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const positions = await prisma.job_positions.findMany({
      where: { org_id: parseInt(orgId) },
      include: { _count: { select: { candidates: true } } },
      orderBy: { created_at: "desc" },
    });
    res.status(200).json({ success: true, positions });
  } catch (error) {
    console.error("Error en getJobPositions:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const updateJobPosition = async (req, res) => {
  try {
    const { orgId, positionId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin", "recruiter"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const position = await prisma.job_positions.update({
      where: { id: parseInt(positionId) },
      data: req.body,
    });
    res.status(200).json({ success: true, position });
  } catch (error) {
    console.error("Error en updateJobPosition:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const deleteJobPosition = async (req, res) => {
  try {
    const { orgId, positionId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    await prisma.job_positions.delete({ where: { id: parseInt(positionId) } });
    res.status(200).json({ success: true, message: "Puesto eliminado." });
  } catch (error) {
    console.error("Error en deleteJobPosition:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { createJobPosition, getJobPositions, updateJobPosition, deleteJobPosition };
