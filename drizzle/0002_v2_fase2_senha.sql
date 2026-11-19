-- Liinc Mentorias v2 — Fase 2: login com senha individual
-- Idempotente e apenas aditiva (o código anterior continua funcionando).

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS login_attempts (
  id            serial PRIMARY KEY,
  username      text NOT NULL,
  attempted_at  timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_username_idx ON login_attempts (username, attempted_at);

COMMIT;
