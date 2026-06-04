-- ============================================
-- CV Analyzer - Script de base de datos MySQL
-- Ejecutar en MySQL Workbench antes de iniciar
-- el servidor por primera vez
-- ============================================

-- 1. Crear la base de datos
CREATE DATABASE IF NOT EXISTS cv_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Seleccionarla
USE cv_analyzer;

-- 3. Tabla de usuarios
--    (Sequelize la crea automáticamente con sync(),
--     pero puedes crearla manualmente aquí también)
CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  name          VARCHAR(50)   NOT NULL,
  email         VARCHAR(100)  NOT NULL,
  password      VARCHAR(255)  NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  analysis_count INT          NOT NULL DEFAULT 0,
  last_analysis DATETIME      NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_email (email),
  INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Verificación: muestra las tablas creadas
-- ============================================
SHOW TABLES;
DESCRIBE users;
