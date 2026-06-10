-- Agregar campos de plan y límites a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS analyses_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS analyses_limit INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_analysis_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS free_blocked_until TIMESTAMPTZ;

-- Índice para búsquedas por plan
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Verificar
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
