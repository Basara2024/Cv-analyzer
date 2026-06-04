USE cv_analyzer;

CREATE TABLE IF NOT EXISTS analyses (
  id                  INT           NOT NULL AUTO_INCREMENT,
  user_id             INT           NOT NULL,
  file_name           VARCHAR(255)  NOT NULL,
  puntuacion_general  INT           NOT NULL,
  resumen             TEXT          NOT NULL,
  resultado_json      JSON          NOT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_analyses_user_id (user_id),
  CONSTRAINT fk_analyses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Verificar
SHOW TABLES;
DESCRIBE analyses;
