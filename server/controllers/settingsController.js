const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const { checkOrgAccess } = require("./organizationController");

// @route PUT /api/organizations/:orgId/settings
// Actualizar datos de la empresa — solo owner/admin
const updateOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId, ["owner", "admin"]);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const { name, nit, economic_activity, country, city, size, logo_url } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (nit !== undefined) data.nit = nit;
    if (economic_activity !== undefined) data.economic_activity = economic_activity;
    if (country !== undefined) data.country = country;
    if (city !== undefined) data.city = city;
    if (size !== undefined) data.size = size;
    if (logo_url !== undefined) data.logo_url = logo_url;

    const organization = await prisma.organizations.update({
      where: { id: parseInt(orgId) },
      data,
    });

    res.status(200).json({ success: true, organization });
  } catch (error) {
    console.error("Error en updateOrganization:", error);
    res.status(500).json({ success: false, message: "Error al actualizar la empresa." });
  }
};

// @route PUT /api/auth/change-password
// Cambiar contraseña — disponible para cualquier usuario autenticado
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Debes ingresar la contraseña actual y la nueva." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "La nueva contraseña debe tener al menos 6 caracteres." });
    }

    const user = await prisma.users.findUnique({ where: { id: req.user.id } });

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Tu cuenta usa inicio de sesión social y no tiene contraseña configurada todavía.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "La contraseña actual es incorrecta." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.users.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ success: true, message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { updateOrganization, changePassword };
