const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Analysis = sequelize.define(
  "Analysis",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    puntuacion_general: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resumen: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    resultado_json: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "analyses",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Analysis;
