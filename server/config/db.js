const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      charset: "utf8mb4",
      authPlugins: {
        mysql_native_password: () => () => Buffer.from(process.env.DB_PASSWORD || ""),
      },
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL conectado correctamente");

    // sync({ force: false }) crea las tablas si no existen, sin borrar datos
    await sequelize.sync({ force: false });
    console.log("✅ Tablas sincronizadas con la base de datos");
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
