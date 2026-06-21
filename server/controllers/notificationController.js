const prisma = require("../config/db");
const { checkOrgAccess } = require("./organizationController");

const getNotifications = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const notifications = await prisma.notifications.findMany({
      where: {
        org_id: parseInt(orgId),
        user_id: req.user.id,
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notifications.count({
      where: {
        org_id: parseInt(orgId),
        user_id: req.user.id,
        is_read: false,
      },
    });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Error en getNotifications:", error);
    res.status(500).json({ success: false, message: "Error al cargar notificaciones." });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { orgId, notificationId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    const notification = await prisma.notifications.findFirst({
      where: {
        id: parseInt(notificationId),
        org_id: parseInt(orgId),
        user_id: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada." });
    }

    const updated = await prisma.notifications.update({
      where: { id: notification.id },
      data: { is_read: true },
    });

    res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    console.error("Error en markNotificationRead:", error);
    res.status(500).json({ success: false, message: "Error al marcar la notificación." });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const { orgId } = req.params;
    const member = await checkOrgAccess(req.user.id, orgId);
    if (!member) return res.status(403).json({ success: false, message: "No tienes acceso." });

    await prisma.notifications.updateMany({
      where: {
        org_id: parseInt(orgId),
        user_id: req.user.id,
        is_read: false,
      },
      data: { is_read: true },
    });

    res.status(200).json({ success: true, message: "Todas las notificaciones marcadas como leídas." });
  } catch (error) {
    console.error("Error en markAllNotificationsRead:", error);
    res.status(500).json({ success: false, message: "Error al marcar notificaciones." });
  }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };
