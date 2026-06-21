require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const analyzeRoutes = require("./routes/analyzeRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      // Peticiones server-side (NextAuth) no envían Origin
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      console.warn(`CORS bloqueado para origen: ${origin}`);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/organizations", interviewRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Matchia API funcionando",
    timestamp: new Date().toISOString(),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

app.use((err, req, res, next) => {
  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "Origen no permitido. Revisa CLIENT_URL en el servidor.",
    });
  }
  console.error("Error no manejado:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Conectado a Supabase (PostgreSQL)");
    console.log(`🌐 CORS permitido para: ${allowedOrigins.join(", ")}`);
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📋 Entorno: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Error conectando:", error);
    process.exit(1);
  }
};

startServer();
module.exports = app;
