const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre es obligatorio" },
        len: { args: [2, 50], msg: "El nombre debe tener entre 2 y 50 caracteres" },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: "Ya existe una cuenta con este email" },
      validate: {
        notEmpty: { msg: "El email es obligatorio" },
        isEmail: { msg: "Por favor ingresa un email válido" },
      },
      set(value) {
        this.setDataValue("email", value.toLowerCase().trim());
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "La contraseña es obligatoria" },
        len: { args: [6, 255], msg: "La contraseña debe tener al menos 6 caracteres" },
      },
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },
    analysis_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_analysis: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,           // agrega createdAt y updatedAt
    underscored: true,          // snake_case en columnas SQL
    // Nunca retornar password en queries normales
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: { attributes: {} }, // incluye todo
    },
  }
);

// --- Hook: hash de contraseña antes de crear o actualizar ---
const hashPassword = async (user) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
};
User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);

// --- Método de instancia: comparar contraseñas ---
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// --- Método de instancia: respuesta pública (sin password) ---
User.prototype.toPublicJSON = function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    analysisCount: this.analysis_count,
    lastAnalysis: this.last_analysis,
    createdAt: this.createdAt,
  };
};

module.exports = User;
