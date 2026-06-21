const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const prisma = require("../config/db");

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

const PLAN_PRICES = {
  business_monthly: { amount: 30, currency: "USD", title: "Matchia Business — Mensual" },
  business_yearly: { amount: 300, currency: "USD", title: "Matchia Business — Anual" },
};

// @route POST /api/payments/create-preference
// Crea la preferencia de pago para el plan Business
const createPreference = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ success: false, message: "Plan inválido." });
    }

    const planInfo = PLAN_PRICES[plan];

    const subscription = await prisma.subscriptions.create({
      data: {
        user_id: req.user.id,
        plan,
        status: "pending",
        amount: planInfo.amount,
        currency: planInfo.currency,
      },
    });

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            title: planInfo.title,
            quantity: 1,
            unit_price: planInfo.amount,
            currency_id: planInfo.currency,
          },
        ],
        external_reference: String(subscription.id),
        back_urls: {
          success: `${process.env.CLIENT_URL}/business/onboarding?status=success`,
          failure: `${process.env.CLIENT_URL}/dashboard?reopen_plan_modal=true&status=failed`,
          pending: `${process.env.CLIENT_URL}/dashboard?reopen_plan_modal=true&status=pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.SERVER_URL}/api/payments/webhook`,
      },
    });

    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { mp_preference_id: result.id },
    });

    res.status(200).json({ success: true, preferenceId: result.id, initPoint: result.init_point });
  } catch (error) {
    console.error("Error en createPreference:", error);
    res.status(500).json({ success: false, message: "Error al crear la preferencia de pago." });
  }
};

// @route POST /api/payments/webhook
// MercadoPago notifica aquí cuando el estado de un pago cambia
const webhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: data.id });

      const subscriptionId = parseInt(paymentInfo.external_reference);
      const subscription = await prisma.subscriptions.findUnique({ where: { id: subscriptionId } });

      if (subscription) {
        const statusMap = {
          approved: "approved",
          rejected: "rejected",
          pending: "pending",
          cancelled: "cancelled",
        };

        const newStatus = statusMap[paymentInfo.status] || "pending";

        await prisma.subscriptions.update({
          where: { id: subscriptionId },
          data: {
            status: newStatus,
            mp_payment_id: String(paymentInfo.id),
            starts_at: newStatus === "approved" ? new Date() : undefined,
            expires_at:
              newStatus === "approved"
                ? new Date(Date.now() + (subscription.plan === "business_yearly" ? 365 : 30) * 24 * 60 * 60 * 1000)
                : undefined,
          },
        });

        if (newStatus === "approved") {
          await prisma.user.update({
            where: { id: subscription.user_id },
            data: { plan: "business" },
          });
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error en webhook de MercadoPago:", error);
    res.status(200).send("OK"); // Siempre 200 para que MP no reintente innecesariamente
  }
};

// @route GET /api/payments/status/:subscriptionId
// Permite que el frontend verifique el estado tras volver del checkout
const getSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await prisma.subscriptions.findFirst({
      where: { user_id: req.user.id },
      orderBy: { created_at: "desc" },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: "No hay suscripciones registradas." });
    }

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error("Error en getSubscriptionStatus:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { createPreference, webhook, getSubscriptionStatus };
