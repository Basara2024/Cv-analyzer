CREATE TABLE IF NOT EXISTS subscriptions (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan             VARCHAR(30) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  amount           DECIMAL(10, 2) NOT NULL,
  currency         VARCHAR(10) NOT NULL DEFAULT 'USD',
  mp_preference_id VARCHAR(255),
  mp_payment_id    VARCHAR(255),
  starts_at        TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
