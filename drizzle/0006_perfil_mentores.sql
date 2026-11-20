-- Liinc Mentorias — Perfil dos mentores (área de atuação e experiência, preenchidos pelo admin)
-- Idempotente e aditiva.

BEGIN;

ALTER TABLE mentors ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS experience text;

COMMIT;
